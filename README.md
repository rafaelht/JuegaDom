# 🎲 JuegaDom - Sistema de Lotería

JuegaDom es una aplicación web moderna para generar números de lotería dominicana, incluyendo Leidsa, Kino, Pale y Tripleta. La aplicación está construida con React, TypeScript y Supabase como backend.

## 🚀 Características

- **Generación de números**: Genera números aleatorios para diferentes tipos de lotería
- **Autenticación de usuarios**: Sistema completo de registro e inicio de sesión
- **Historial personal**: Guarda y gestiona tus números generados
- **Interfaz moderna**: Diseño responsive y atractivo
- **Backend en Supabase**: Base de datos PostgreSQL con autenticación integrada

## 🛠️ Tecnologías

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Autenticación**: Supabase Auth
- **Base de datos**: PostgreSQL (hosted en Supabase)

## 📋 Prerrequisitos

- Node.js 16+ 
- npm o yarn
- Cuenta en Supabase

## 🔧 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <repository-url>
   cd JuegaDom
   ```

2. **Instala las dependencias del cliente**
   ```bash
   cd client
   npm install
   ```

3. **Configura Supabase**
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta el script SQL para crear las tablas (ver `supabase-schema.sql`)
   - Copia las credenciales de tu proyecto

4. **Configura las variables de entorno**
   Crea un archivo `.env.local` en la carpeta `client`:
   ```env
   REACT_APP_SUPABASE_URL=tu_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=tu_supabase_anon_key
   ```

5. **Ejecuta la aplicación**
   ```bash
   npm start
   ```

## 🗄️ Configuración de la Base de Datos

Ejecuta el siguiente script SQL en tu proyecto de Supabase:

```sql
-- Crear tabla de usuarios
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de números de lotería
CREATE TABLE lottery_numbers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  numbers TEXT NOT NULL, -- JSON array de números
  mas_number TEXT, -- JSON del número Más (para Leidsa)
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('leidsa', 'kino', 'pale', 'tripleta')),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla de estadísticas de números
CREATE TABLE number_statistics (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL,
  game_type VARCHAR(20) NOT NULL,
  frequency INTEGER DEFAULT 0,
  last_appearance TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(number, game_type)
);

-- Políticas de seguridad RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lottery_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE number_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas para usuarios
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para números de lotería
CREATE POLICY "Users can view own lottery numbers" ON lottery_numbers
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = FALSE);

CREATE POLICY "Users can insert own lottery numbers" ON lottery_numbers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lottery numbers" ON lottery_numbers
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para estadísticas (lectura pública)
CREATE POLICY "Anyone can view number statistics" ON number_statistics
  FOR SELECT USING (true);
```

## 🎮 Tipos de Lotería Soportados

- **Leidsa**: 6 números del 1 al 38 + Más del 1 al 12
- **Kino**: 20 números del 1 al 80
- **Pale**: 3 números del 1 al 25
- **Tripleta**: 3 números del 00 al 99

## 🔐 Autenticación

La aplicación usa Supabase Auth para:
- Registro de usuarios
- Inicio de sesión
- Gestión de sesiones
- Recuperación de contraseñas

## 📱 Funcionalidades

### Para Usuarios
- Registro e inicio de sesión
- Generación de números de lotería
- Historial de números generados
- Eliminación de números
- Estadísticas personales

### Para Administradores
- Panel de administración
- Gestión de usuarios
- Estadísticas globales
- Moderación de contenido

## 🚀 Despliegue

### Netlify
1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno
3. Deploy automático en cada push

### Vercel
1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

## 🔧 Desarrollo

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Construir para producción
npm run build

# Ejecutar tests
npm test
```

## 📝 Estructura del Proyecto

```
client/
├── src/
│   ├── components/     # Componentes React
│   ├── contexts/       # Contextos (Auth, etc.)
│   ├── services/       # Servicios de Supabase
│   ├── types/          # Tipos TypeScript
│   └── config/         # Configuración
├── public/             # Archivos estáticos
└── package.json
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:
- Abre un issue en GitHub
- Contacta al equipo de desarrollo
- Revisa la documentación de Supabase

## 🔄 Changelog

### v2.0.0
- Migración completa a Supabase
- Eliminación del servidor local
- Mejoras en la autenticación
- Interfaz más moderna

### v1.0.0
- Versión inicial con servidor local
- Funcionalidades básicas de lotería
- Autenticación básica 