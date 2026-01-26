#!/bin/bash
# Deploy script para BeerFinder (Django + React)
# Uso: ./deploy.sh [nombre-rama]
# Si no se pasa nada → usa "master" por defecto

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funciones para mensajes
log()   { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }

# ========================================
# CONFIGURACIÓN - Ajustar según tu servidor
# ========================================
PROJECT_DIR="/var/www/html/BeerFinder"
VENV_DIR="${PROJECT_DIR}/venv"
BRANCH="${1:-master}"

# ========================================
# Inicio del despliegue
# ========================================
echo ""
log "=========================================="
log "  Iniciando despliegue de BeerFinder"
log "=========================================="
echo ""

cd "${PROJECT_DIR}" || { error "No se pudo acceder a ${PROJECT_DIR}"; exit 1; }

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/manage.py" ]; then
    error "No se encontró backend/manage.py. ¿Estás en el directorio correcto?"
    exit 1
fi

log "Rama seleccionada para el despliegue: ${BRANCH}"

# Verificar que la rama exista remotamente
log "Comprobando que la rama '${BRANCH}' exista en el repositorio remoto..."
if ! git ls-remote --exit-code origin "${BRANCH}" >/dev/null 2>&1; then
    error "La rama '${BRANCH}' no existe en el repositorio remoto."
    exit 1
fi

# ========================================
# Verificar/instalar dependencias del sistema
# ========================================
log "Verificando dependencias del sistema para GeoDjango/PostGIS..."

# Función para verificar si un paquete está instalado
check_package() {
    dpkg -l "$1" 2>/dev/null | grep -q "^ii"
}

# Lista de paquetes necesarios para GeoDjango y Python
REQUIRED_PACKAGES="gdal-bin libgdal-dev python3-gdal postgresql-client python3-venv"

# Detectar versión de PostgreSQL instalada y añadir PostGIS
PG_VERSION=$(pg_config --version 2>/dev/null | grep -oP '\d+' | head -1)
if [ -n "$PG_VERSION" ]; then
    POSTGIS_PKG="postgresql-${PG_VERSION}-postgis-3"
    log "Detectada PostgreSQL versión ${PG_VERSION}, verificando ${POSTGIS_PKG}..."
    REQUIRED_PACKAGES="$REQUIRED_PACKAGES $POSTGIS_PKG"
else
    warn "No se pudo detectar la versión de PostgreSQL"
    warn "Si usas PostgreSQL local, instala manualmente: postgresql-XX-postgis-3"
fi
MISSING_PACKAGES=""

for pkg in $REQUIRED_PACKAGES; do
    if ! check_package "$pkg"; then
        MISSING_PACKAGES="$MISSING_PACKAGES $pkg"
    fi
done

if [ -n "$MISSING_PACKAGES" ]; then
    warn "Faltan paquetes del sistema:$MISSING_PACKAGES"
    log "Instalando dependencias del sistema..."
    
    # Verificar si podemos usar sudo
    if command -v sudo &> /dev/null; then
        sudo apt-get update -qq
        sudo apt-get install -y $MISSING_PACKAGES
    else
        apt-get update -qq
        apt-get install -y $MISSING_PACKAGES
    fi
    
    if [ $? -ne 0 ]; then
        error "Falló la instalación de dependencias del sistema"
        error "Instala manualmente: apt-get install$MISSING_PACKAGES"
        exit 1
    fi
    success "Dependencias del sistema instaladas"
else
    success "Todas las dependencias del sistema están instaladas"
fi

# ========================================
# Actualizar código desde repositorio
# ========================================
log "Restaurando estado limpio del repositorio..."
git fetch origin "${BRANCH}"
git reset --hard "origin/${BRANCH}"
git clean -fd
success "Código actualizado desde origin/${BRANCH}"

# ========================================
# FRONTEND - Build de React
# ========================================
echo ""
log "=========================================="
log "  Construyendo Frontend (React)"
log "=========================================="

cd "${PROJECT_DIR}/frontend" || { error "No se pudo acceder a frontend/"; exit 1; }

log "Instalando dependencias de Node.js..."
npm install --silent
if [ $? -ne 0 ]; then
    error "Falló la instalación de dependencias de Node.js"
    exit 1
fi
success "Dependencias de Node.js instaladas"

log "Compilando build de producción..."
npm run build
if [ $? -ne 0 ]; then
    error "Falló la compilación del frontend"
    exit 1
fi
success "Frontend compilado en frontend/build/"

# ========================================
# BACKEND - Configuración de Django
# ========================================
echo ""
log "=========================================="
log "  Configurando Backend (Django)"
log "=========================================="

cd "${PROJECT_DIR}/backend" || { error "No se pudo acceder a backend/"; exit 1; }

# Crear y activar entorno virtual
if [ ! -d "${VENV_DIR}" ]; then
    log "Creando entorno virtual en ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
    if [ $? -ne 0 ]; then
        error "Falló la creación del entorno virtual"
        error "Asegúrate de tener python3-venv instalado: apt install python3-venv"
        exit 1
    fi
    success "Entorno virtual creado"
fi

log "Activando entorno virtual..."
source "${VENV_DIR}/bin/activate"

log "Instalando dependencias de Python..."
pip install -r requirements.txt --quiet
if [ $? -ne 0 ]; then
    error "Falló la instalación de dependencias de Python"
    exit 1
fi
success "Dependencias de Python instaladas"

# Migraciones de base de datos
log "Ejecutando migraciones de base de datos..."
python manage.py migrate --noinput
if [ $? -ne 0 ]; then
    error "Fallaron las migraciones de base de datos"
    exit 1
fi
success "Migraciones aplicadas correctamente"

# Recolectar archivos estáticos
log "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput --clear
if [ $? -ne 0 ]; then
    error "Falló collectstatic"
    exit 1
fi
success "Archivos estáticos recolectados en backend/staticfiles/"

# ========================================
# Optimizaciones para producción
# ========================================
echo ""
log "=========================================="
log "  Verificaciones finales"
log "=========================================="

# Verificar configuración de Django
log "Verificando configuración de Django..."
python manage.py check --deploy 2>/dev/null
if [ $? -eq 0 ]; then
    success "Configuración de Django verificada"
else
    warn "Hay advertencias en la configuración de Django (revisar manualmente)"
fi

# Protección contra cambios accidentales
log "Protegiendo entorno de producción..."
git config core.fileMode false

# ========================================
# Mensaje final
# ========================================
echo ""
log "=========================================="
log "  ¡Despliegue completado exitosamente!"
log "=========================================="
echo ""

success "Frontend build: ${PROJECT_DIR}/frontend/build/"
success "Backend static: ${PROJECT_DIR}/backend/staticfiles/"
success "Rama desplegada: ${BRANCH}"

echo ""
warn "Configuración de Apache necesaria:"
echo "  - DocumentRoot apuntando a frontend/build/"
echo "  - ProxyPass /api/ hacia Gunicorn (puerto 8000)"
echo "  - Alias /static/ hacia backend/staticfiles/"
echo ""
warn "Para iniciar Gunicorn:"
echo "  cd ${PROJECT_DIR}/backend"
echo "  gunicorn beerfinder.wsgi:application --bind 127.0.0.1:8000 --daemon"
echo ""
warn "Recuerda verificar:"
echo "  - Archivo .env configurado correctamente"
echo "  - Variables: DJANGO_DEBUG=False, DJANGO_SECRET_KEY, DB credentials"
echo "  - CORS_ALLOWED_ORIGINS en settings.py para tu dominio"
echo ""
