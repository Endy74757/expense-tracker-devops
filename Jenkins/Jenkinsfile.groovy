// Jenkinsfile
pipeline {
    agent any // ใช้ agent ไหนก็ได้ที่มี Docker, Git, และ Python ติดตั้งอยู่

    environment {
        // กำหนด Registry ของ Docker
        DOCKER_REGISTRY = "endy95"
        // กำหนด Credentials ID สำหรับ Docker Hub/Registry ที่ตั้งค่าไว้ใน Jenkins
        DOCKER_CREDENTIALS_ID = "dockerhub-credentials"
        // กำหนด Credentials ID สำหรับ Git (ต้องมีสิทธิ์ push)
        GIT_CREDENTIALS_ID = "github-credentials" // << เพิ่ม: ID ของ credential สำหรับ push code
    }

    // ใช้ Matrix เพื่อ build ทุก service แบบขนานกัน
    matrix {
        axes {
            axis {
                name 'SERVICE_NAME'
                values 'user_service', 'transaction_service', 'category_service'
            }
        }
        // ยกเว้นบาง combination (ถ้ามี)
        // exclusions { ... }
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'กำลังดึงซอร์สโค้ด...'
                // ดึงโค้ดจาก Git Repository ของคุณ
                // คุณต้องตั้งค่า Repository URL ใน Jenkins Job Configuration
                checkout scm
            }
        }

        stage('Install Dependencies & Test') {
            when { expression { false } }
            steps {
                dir("backend/${SERVICE_NAME}") {
                    echo "--- [${SERVICE_NAME}] Installing Dependencies & Running Tests ---"
                    sh 'python3 -m venv venv'
                    // ติดตั้ง dependencies จาก requirements.txt ของแต่ละ service
                    sh '. venv/bin/activate && pip install -r requirements.txt'
                    // รัน Unit Test (ถ้ามี)
                    // sh '. venv/bin/activate && pytest'
                }
            }
        }

        stage('Code Analysis (Optional)') {
            // Stage นี้เป็นทางเลือก สำหรับการวิเคราะห์คุณภาพโค้ดด้วย SonarQube
            // หากไม่ต้องการใช้ สามารถลบ stage นี้ออกได้
            when { expression { false } } // ปิดการใช้งาน stage นี้ไว้ก่อน
            steps {
                echo 'กำลังวิเคราะห์คุณภาพโค้ดด้วย SonarQube...'
                // คุณต้องตั้งค่า SonarQube Server ใน Jenkins ก่อน
                // และใช้ SonarScanner CLI สำหรับโปรเจกต์ Python
                // withSonarQubeEnv('My-SonarQube') {
                //     sh 'sonar-scanner ...'
                // }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("backend/${SERVICE_NAME}") {
                    echo "--- [${SERVICE_NAME}] Building Docker Image ---"
                    script {
                        // สร้าง tag สำหรับ image โดยใช้ Build Number ของ Jenkins
                        def imageTag = "${env.BUILD_NUMBER}"
                        // สร้างชื่อ image แบบเต็ม เช่น endy95/user_service:123
                        def fullImageName = "${env.DOCKER_REGISTRY}/${SERVICE_NAME}:${imageTag}"
                        // คำสั่ง build image จาก Dockerfile ที่อยู่ในโฟลเดอร์ของ service นั้นๆ
                        sh "docker build -t ${fullImageName} ."
                    }
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo 'กำลัง Push Docker image ไปยัง Registry...'
                echo "--- [${SERVICE_NAME}] Pushing Docker Image ---"
                script {
                    def imageTag = "${env.BUILD_NUMBER}"
                    def fullImageName = "${env.DOCKER_REGISTRY}/${SERVICE_NAME}:${imageTag}"
                    // Login เข้า Docker Registry โดยใช้ Credentials ที่ตั้งค่าไว้ใน Jenkins
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh "echo ${DOCKER_PASS} | docker login ${env.DOCKER_REGISTRY} -u ${DOCKER_USER} --password-stdin"
                        sh "docker push ${fullImageName}"
                        sh "docker logout ${env.DOCKER_REGISTRY}"
                    }
                }
            }
        }

        stage('Update Config & Push to Git (Trigger ArgoCD)') {
            // Stage นี้จะทำงานเฉพาะเมื่อ build branch 'dev' หรือ 'main' เท่านั้น
            when {
                anyOf {
                    branch 'dev'
                    branch 'main'
                }
            }
            steps {
                echo "--- [${SERVICE_NAME}] Updating Helm Values in Git ---"
                script {
                    // กำหนด environment (dev/prod) จากชื่อ branch
                    def environment = (env.BRANCH_NAME == 'main') ? 'prod' : 'dev'
                    // กำหนด path ของไฟล์ values ที่จะแก้ไข
                    def valuesFilePath = "argocd/${environment}/${SERVICE_NAME}/values-${environment}.yaml"

                    // ใช้เครื่องมือ yq เพื่อแก้ไขไฟล์ YAML (ต้องติดตั้งใน Jenkins Agent)
                    // ถ้าไม่มี yq สามารถใช้ sed หรือ Groovy script แทนได้
                    sh "yq -i '.services.${SERVICE_NAME}.image.tag = \"${env.BUILD_NUMBER}\"' ${valuesFilePath}"

                    // Commit และ Push การเปลี่ยนแปลงกลับไปที่ Git
                    withCredentials([string(credentialsId: GIT_CREDENTIALS_ID, variable: 'GIT_TOKEN')]) {
                        sh """
                            git config --global user.email "jenkins@example.com"
                            git config --global user.name "Jenkins CI"
                            git add ${valuesFilePath}
                            git commit -m "ci: Update ${SERVICE_NAME} image tag to ${env.BUILD_NUMBER} for ${environment} [skip ci]"
                            // ใช้ Token ในการ Push
                            git push https://x-access-token:${GIT_TOKEN}@github.com/Endy74757/expense-tracker-devops.git HEAD:${env.BRANCH_NAME}
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            // ขั้นตอนที่จะทำเสมอ ไม่ว่า pipeline จะสำเร็จหรือล้มเหลว
            echo 'Pipeline เสร็จสิ้น'
            // ทำความสะอาด workspace
            cleanWs()
            // Logout จาก Docker Registry
        }
        success {
            // ขั้นตอนที่จะทำเมื่อ pipeline สำเร็จ
            echo 'Pipeline สำเร็จ!'
            // สามารถเพิ่มการแจ้งเตือนไปยัง Slack หรือ Email ที่นี่
        }
        failure {
            // ขั้นตอนที่จะทำเมื่อ pipeline ล้มเหลว
            echo 'Pipeline ล้มเหลว!'
            // สามารถเพิ่มการแจ้งเตือนไปยัง Slack หรือ Email ที่นี่
        }
    }
}
