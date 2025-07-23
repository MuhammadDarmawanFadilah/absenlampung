# BACKEND REDEPLOY GUIDE
## Quick Backend Redeployment for Production

### 🚀 ONE-COMMAND BACKEND REDEPLOY

#### **Method 1: Quick Redeploy (Recommended)**
```bash
echo "🔄 Starting Backend Redeploy..." && \
sudo systemctl stop tomcat && \
sudo rm -f /opt/tomcat/webapps/silapor.war && \
sudo rm -rf /opt/tomcat/webapps/silapor && \
cd /tmp && \
sudo rm -rf /tmp/pemilihan && \
sudo git clone https://github.com/MuhammadDarmawanFadilah/pemilihan.git /tmp/pemilihan && \
cd /tmp/pemilihan/backend && \
sudo cp src/main/resources/application-prod.properties src/main/resources/application.properties && \
sudo mvn clean package -DskipTests -Dspring.profiles.active=prod && \
sudo cp target/backend.war /opt/tomcat/webapps/silapor.war && \
sudo systemctl start tomcat && \
echo "✅ Backend redeployed successfully!" && \
echo "📋 Checking service status..." && \
sudo systemctl status tomcat --no-pager
```

#### **Method 2: Force Clean Redeploy**
```bash
echo "🔄 Starting Force Clean Backend Redeploy..." && \
sudo systemctl stop tomcat && \
sudo rm -rf /opt/tomcat/webapps/* && \
sudo rm -rf /opt/tomcat/work/* && \
sudo rm -rf /opt/tomcat/temp/* && \
cd /tmp && \
sudo rm -rf /tmp/pemilihan && \
sudo git clone https://github.com/MuhammadDarmawanFadilah/pemilihan.git /tmp/pemilihan && \
cd /tmp/pemilihan/backend && \
sudo cp src/main/resources/application-prod.properties src/main/resources/application.properties && \
sudo mvn clean package -DskipTests -Dspring.profiles.active=prod && \
sudo cp target/backend.war /opt/tomcat/webapps/silapor.war && \
sudo chown -R root:root /opt/tomcat/webapps/ && \
sudo systemctl start tomcat && \
echo "✅ Backend force redeployed successfully!" && \
echo "📋 Checking service status..." && \
sudo systemctl status tomcat --no-pager
```

### 🔧 BACKEND TROUBLESHOOTING COMMANDS

#### **Check Backend Logs:**
```bash
sudo tail -f /opt/tomcat/logs/catalina.out
```

#### **Check Application Logs:**
```bash
sudo tail -f /opt/tomcat/logs/backend.log
```

#### **Check Service Status:**
```bash
sudo systemctl status tomcat --no-pager
```

#### **Manual Tomcat Restart:**
```bash
sudo systemctl stop tomcat && sleep 5 && sudo systemctl start tomcat
```

#### **Check Port 8080:**
```bash
netstat -tlnp | grep :8080
```

#### **Test Backend API:**
```bash
curl -s http://localhost:8080/silapor/api/health || echo "Backend not responding"
```

#### **Maven Build Only (for testing):**
```bash
cd /tmp/pemilihan/backend && \
sudo mvn clean package -DskipTests -Dspring.profiles.active=prod
```

### 📋 BACKEND VERIFICATION STEPS

#### **Step 1: Service Check**
```bash
sudo systemctl is-active tomcat
```

#### **Step 2: Port Check**
```bash
curl -s http://localhost:8080/silapor/api/health
```

#### **Step 3: Database Connection Check**
```bash
mysql -u root -e "SHOW PROCESSLIST;" | grep silapor
```

### 🚨 EMERGENCY BACKEND RECOVERY

#### **If Backend Won't Start:**
```bash
sudo systemctl stop tomcat && \
sudo rm -rf /opt/tomcat/webapps/silapor* && \
sudo rm -rf /opt/tomcat/work/* && \
sudo rm -rf /opt/tomcat/temp/* && \
sudo rm -rf /opt/tomcat/logs/catalina.out && \
sudo systemctl start tomcat && \
echo "Tomcat cleaned and restarted"
```

#### **If Database Connection Fails:**
```bash
mysql -u root -e "SHOW DATABASES;" && \
mysql -u root -e "USE pemilihan; SHOW TABLES;" && \
sudo systemctl restart mysql && \
sleep 5 && \
sudo systemctl restart tomcat
```

### ⚡ RAPID BACKEND DEPLOYMENT ALIASES

Add these to your `~/.bashrc` for quick access:

```bash
# Quick Backend Redeploy
alias redeploy-backend='sudo systemctl stop tomcat && sudo rm -f /opt/tomcat/webapps/silapor.war && sudo rm -rf /opt/tomcat/webapps/silapor && cd /tmp && sudo rm -rf /tmp/pemilihan && sudo git clone https://github.com/MuhammadDarmawanFadilah/pemilihan.git /tmp/pemilihan && cd /tmp/pemilihan/backend && sudo cp src/main/resources/application-prod.properties src/main/resources/application.properties && sudo mvn clean package -DskipTests -Dspring.profiles.active=prod && sudo cp target/backend.war /opt/tomcat/webapps/silapor.war && sudo systemctl start tomcat'

# Backend Status Check
alias backend-status='sudo systemctl status tomcat --no-pager && netstat -tlnp | grep :8080'

# Backend Logs
alias backend-logs='sudo tail -f /opt/tomcat/logs/catalina.out'
```

### 📊 BACKEND DEPLOYMENT SPECS
- **Build Time**: ~2-3 minutes
- **Deploy Time**: ~30 seconds
- **Total Time**: ~3-4 minutes
- **Memory Usage**: 8-12GB RAM
- **Port**: 8080
- **Context Path**: /silapor

### 🌐 BACKEND ACCESS POINTS
- **Health Check**: http://localhost:8080/silapor/api/health
- **API Base**: http://localhost:8080/silapor/api
- **Public API**: https://trensilapor.my.id/api

---
**Quick Deploy**: 3-4 minutes  
**Zero Downtime**: Use Method 1  
**Emergency Recovery**: Method 2
