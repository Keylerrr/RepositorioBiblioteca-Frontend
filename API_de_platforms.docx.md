**API de PLATFORMS**

**Plataformas, sintaxis y verificación de enlaces**

*Contrato de integración para Frontend — Fase A*

# **1\. Objetivo y alcance**

Este documento define el contrato HTTP que debe utilizar el Frontend para consumir la API de \`platforms\`. Incluye rutas, métodos, parámetros, cuerpos de solicitud, respuestas, paginación, filtros, ordenamiento, reglas de negocio, estados, eliminación lógica, restauración y ejemplos. La documentación se basa en los serializers, viewsets, filtros, modelos y servicios disponibles en el proyecto.

# **2\. Configuración general de la API**

| Elemento | Valor |
| :---- | :---- |
| Base URL local | http\://localhost:8000 |
| Swagger | http\://localhost:8000/api/docs/ |
| OpenAPI | http\://localhost:8000/api/schema/ |
| Formato | JSON |
| Trailing slash | Sí: las rutas terminan en \`/\`. |
| Autenticación Fase A | No requerida; DRF está configurado con AllowAny y sin clases de autenticación por defecto. |
| Página por defecto | 10 registros |
| Máximo solicitado por \`page\_size\` | 100 |
| Parámetro de página | \`page\` |
| Parámetro de tamaño | \`page\_size\` |
| Parámetro de búsqueda | \`search\` |
| Parámetro de ordenamiento | \`ordering\` |

El Frontend no debe asumir autenticación todavía. La Fase B incorporará autenticación/permisos; cuando eso ocurra, el contrato de headers deberá actualizarse.

# **3\. Paginación: contrato obligatorio**

{  
  "current\_page": 1,  
  "total\_pages": 4,  
  "page\_size": 10,  
  "total\_items": 37,  
  "next": "http\://localhost:8000/api/.../?page=2",  
  "previous": null,  
  "results": \[  
    {  
      "item\_number": 1  
    }  
  \]  
}

* \`current\_page\`: página actual.  
* \`total\_pages\`: número total de páginas.  
* \`page\_size\`: tamaño efectivo de página.  
* \`total\_items\`: total de registros que cumplen los filtros.  
* \`next\`: URL completa de la siguiente página o \`null\`.  
* \`previous\`: URL completa de la página anterior o \`null\`.  
* \`results\`: registros de la página.  
* \`item\_number\`: consecutivo global del registro dentro del listado, no se reinicia en cada página.

Ejemplos:

GET /api/.../?page=2  
GET /api/.../?page=2\&page\_size=50

# **4\. Búsqueda y ordenamiento**

El Frontend puede construir la consulta agregando parámetros en la misma URL. Para ordenar de forma descendente se antepone \`-\` al campo.

# **5\. Campos de auditoría**

Los serializers administrativos definen campos de auditoría de solo lectura. El Frontend no debe enviarlos al crear o actualizar.

{  
  "id": 1,  
  "created\_by": 0,  
  "created\_at": "2026-10-01T10:30:00Z",  
  "updated\_by": 0,  
  "updated\_at": "2026-10-01T10:45:00Z",  
  "deleted\_by": null,  
  "deleted\_at": null,  
  "delete\_explanation": null  
}

El proyecto contiene pruebas históricas que esperan que algunos campos de auditoría no aparezcan en determinadas respuestas, mientras que el serializer administrativo actual los declara en \`fields\`. Por ello, para el contrato final del Frontend debe tomarse como fuente ejecutable el OpenAPI generado por \`/api/schema/\` y la respuesta real del servidor después de integrar la última versión.

# **6\. Recursos y rutas**

| Recurso | Ruta | Métodos |
| :---- | :---- | :---- |
| Plataformas administrativas | /api/platforms/ | GET, POST |
| Plataforma individual | /api/platforms/{id}/ | GET, PUT, PATCH, DELETE |
| Plataformas archivadas | /api/platforms/archived/ | GET |
| Restaurar plataforma | /api/platforms/{id}/restore/ | POST |
| Publicar | /api/platforms/{id}/publish/ | POST |
| Marcar obsoleta | /api/platforms/{id}/mark-obsolete/ | POST |
| Reactivar | /api/platforms/{id}/reactivate/ | POST |
| Verificar enlace | /api/platforms/{id}/check-link/ | POST |
| Sintaxis administrativas | /api/platforms/valid-sintaxis/ | GET, POST |
| Sintaxis individual | /api/platforms/valid-sintaxis/{id}/ | GET, PUT, PATCH, DELETE |
| Sintaxis archivadas | /api/platforms/valid-sintaxis/archived/ | GET |
| Restaurar sintaxis | /api/platforms/valid-sintaxis/{id}/restore/ | POST |
| Historial de enlaces | /api/platforms/link-check-logs/ | GET |
| Plataformas públicas | /api/platforms/public/ | GET |
| Detalle público | /api/platforms/public/{id}/ | GET |

# **7\. Modelo administrativo Platform**

| Campo | Tipo | Entrada | Descripción / regla |
| :---- | :---- | :---- | :---- |
| name | string | Lectura/escritura | Nombre; unicidad case-insensitive. |
| status | enum string | Solo lectura | \`borrador\`, \`publicado\`, \`obsoleto\`. |
| base\_api\_url | string|null | Lectura/escritura | URL base de API; usada también por check-link. |
| api\_key | string | Solo escritura | Clave en texto plano; backend la cifra y no devuelve el secreto. |
| url\_image | string|null | Lectura/escritura | URL de imagen. |
| start\_period | date|null | Lectura/escritura | Inicio de cobertura; obligatorio para publicar. |
| finish\_period | date|null | Lectura/escritura | Fin de cobertura; no puede ser anterior al inicio. |
| requires\_registration | boolean | Lectura/escritura | Si requiere cuenta; default \`false\`. |
| has\_access\_text | boolean | Lectura/escritura | Si ofrece texto completo; default \`false\`. |
| valid\_sintaxis | integer|null | Lectura/escritura | ID de ValidSintaxis. |
| validated\_by | integer|null | Solo lectura | Usuario que publicó/validó. |
| validated\_at | datetime|null | Solo lectura | Fecha/hora de publicación. |
| institutions | integer\[\] | Escritura; IDs | Instituciones responsables. |
| languages | integer\[\] | Escritura; IDs | Idiomas. |
| countries | integer\[\] | Escritura; IDs | Países. |
| knowledge\_areas | integer\[\] | Escritura; IDs | Áreas del conocimiento. |
| material\_types | integer\[\] | Escritura; IDs | Tipos de material. |
| academic\_programs | integer\[\] | Escritura; IDs | Programas académicos. |

# **8\. Estados y ciclo de vida**

| Estado | Valor API | Significado |
| :---- | :---- | :---- |
| Borrador | \`borrador\` | Ficha editable pendiente de publicación. |
| Publicado | \`publicado\` | Disponible en exploración pública. |
| Obsoleto | \`obsoleto\` | Ficha publicada que dejó de ser vigente; puede regresar a borrador. |

BORRADOR \-\> PUBLICADO \-\> OBSOLETO \-\> BORRADOR

Reglas:

* Solo una plataforma en borrador puede publicarse.  
* Una plataforma publicada puede marcarse como obsoleta.  
* Una plataforma obsoleta puede reactivarse y vuelve a borrador.  
* Al reactivar se limpian \`validated\_by\` y \`validated\_at\`.  
* Una plataforma restaurada desde Soft Delete vuelve a \`borrador\` y pierde la validación previa.

# **9\. Requisitos para publicar**

El servicio de publicación valida:

| Campo/relación | Condición |
| :---- | :---- |
| Registro | No debe estar eliminado. |
| status | Debe ser \`borrador\`. |
| name | Debe existir y no estar vacío. |
| base\_api\_url | Debe existir. |
| start\_period | Debe existir. |
| finish\_period | Si existe, no puede ser anterior a \`start\_period\`. |
| valid\_sintaxis | Debe existir una sintaxis activa. |
| institutions | Al menos una relación activa. |
| countries | Al menos una relación activa. |
| knowledge\_areas | Al menos una relación activa. |
| material\_types | Al menos una relación activa. |
| languages | Al menos una relación activa. |
| academic\_programs | Al menos una relación activa. |

Si falta una condición, el endpoint responde HTTP 400 con los campos que deben corregirse.

# **10\. Relaciones M2M**

| Campo | Payload | Respuesta administrativa |
| :---- | :---- | :---- |
| institutions | \[1, 2\] | \[1, 2\] |
| languages | \[1, 2\] | \[1, 2\] |
| countries | \[57\] | \[57\] |
| knowledge\_areas | \[3\] | \[3\] |
| material\_types | \[1\] | \[1\] |
| academic\_programs | \[8\] | \[8\] |

* Los IDs repetidos se deduplican durante la sincronización.  
* Campo omitido: no modifica esa relación.  
* Lista vacía explícita: elimina lógicamente las relaciones activas de esa colección.  
* Una relación retirada puede restaurarse automáticamente si vuelve a enviarse.  
* Las relaciones utilizan Soft Delete.

# **11\. Respuesta administrativa de Platform**

{  
  "id": 12,  
  "name": "scopus",  
  "status": "publicado",  
  "base\_api\_url": "https\://api.example.org",  
  "url\_image": "https\://example.org/scopus.png",  
  "start\_period": "2010-01-01",  
  "finish\_period": null,  
  "requires\_registration": true,  
  "has\_access\_text": true,  
  "validated\_by": 0,  
  "validated\_at": "2026-10-01T10:00:00Z",  
  "valid\_sintaxis": 4,  
  "institutions": \[1\],  
  "languages": \[1\],  
  "countries": \[57\],  
  "knowledge\_areas": \[3\],  
  "material\_types": \[1\],  
  "academic\_programs": \[8\]  
}

\`api\_key\` y \`encrypted\_api\_key\` no deben esperarse en la respuesta.

# **12\. Crear plataforma — POST**

POST /api/platforms/  
Content-Type: application/json

{  
  "name": "Scopus",  
  "base\_api\_url": "https\://api.example.org",  
  "api\_key": "raw\_secret\_key",  
  "url\_image": "https\://example.org/scopus.png",  
  "start\_period": "2010-01-01",  
  "requires\_registration": true,  
  "has\_access\_text": true,  
  "valid\_sintaxis": 4,  
  "institutions": \[1\],  
  "languages": \[1\],  
  "countries": \[57\],  
  "knowledge\_areas": \[3\],  
  "material\_types": \[1\],  
  "academic\_programs": \[8\]  
}

La plataforma se crea inicialmente en \`borrador\`.

# **13\. Listar, buscar, filtrar y ordenar**

| Parámetro | Ejemplo | Función |
| :---- | :---- | :---- |
| status | \`?status=publicado\` | Filtra estado. |
| requires\_registration | \`?requires\_registration=true\` | Filtra requerimiento de registro. |
| has\_access\_text | \`?has\_access\_text=true\` | Filtra acceso a texto. |
| valid\_sintaxis | \`?valid\_sintaxis=4\` | Filtra por sintaxis. |
| search | \`?search=scopus\` | Busca por nombre. |
| ordering | \`?ordering=name\` | Orden ascendente. |
| ordering | \`?ordering=-name\` | Orden descendente. |
| page | \`?page=2\` | Página. |
| page\_size | \`?page\_size=50\` | Tamaño máximo 100\. |

# **14\. Publicar**

POST /api/platforms/12/publish/

Si la ficha cumple todas las condiciones, retorna HTTP 200 y la representación administrativa. La plataforma pasa a \`publicado\` y se registran \`validated\_by\` y \`validated\_at\`.

Ejemplo de error:  
HTTP 400  
{  
  "countries": \[  
    "La plataforma debe tener al menos un país activo asociado."  
  \],  
  "academic\_programs": \[  
    "La plataforma debe tener al menos un programa académico activo asociado."  
  \]  
}

# **15\. Obsoleta y reactivación**

POST /api/platforms/12/mark-obsolete/  
POST /api/platforms/12/reactivate/

\`mark-obsolete\` exige estado \`publicado\`. \`reactivate\` exige estado \`obsoleto\` y retorna a \`borrador\`.

# **16\. Verificación de enlace — check-link**

POST /api/platforms/12/check-link/

El backend verifica \`base\_api\_url\` con un cliente HTTP, registra el resultado en \`LinkCheckLog\` y devuelve el registro creado.

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| platform | integer | ID de plataforma. |
| url | string | URL comprobada. |
| fail\_count | integer | Fallos consecutivos; una comprobación exitosa lo reinicia a 0\. |
| http\_status\_code | integer|null | Código HTTP recibido; \`null\` ante fallo de conexión. |
| is\_active | boolean | Indica si el enlace se considera disponible. |
| last\_check | datetime|null | Fecha/hora del chequeo. |

Se consideran disponibles respuestas HTTP 2xx, 3xx, 401 y 403\. No se siguen automáticamente las redirecciones.

El chequeo bloquea URLs locales, privadas, reservadas o no públicamente enrutables y solo admite HTTP/HTTPS.

# **17\. Historial de LinkCheckLog**

GET /api/platforms/link-check-logs/

| Parámetro | Ejemplo |
| :---- | :---- |
| platform | \`?platform=12\` |
| is\_active | \`?is\_active=true\` |
| ordering | \`?ordering=-last\_check\` |
| ordering | \`?ordering=fail\_count\` |
| ordering | \`?ordering=-created\_at\` |
| page | \`?page=2\` |
| page\_size | \`?page\_size=50\` |

Este recurso es de solo lectura: no admite POST/PUT/PATCH/DELETE.

# **18\. ValidSintaxis**

| Campo | Tipo | Descripción |
| :---- | :---- | :---- |
| name | string | Nombre de la sintaxis; unicidad case-insensitive. |
| booleans | array | Lista de operadores booleanos soportados. |
| parenthesis | boolean | Indica soporte de agrupación por paréntesis. |
| fields | object | Mapeo de campos de búsqueda. |

POST /api/platforms/valid-sintaxis/

{  
  "name": "Sintaxis estándar",  
  "booleans": \["AND", "OR", "NOT"\],  
  "parenthesis": true,  
  "fields": {  
    "title": "ti",  
    "language": "la"  
  }  
}

CRUD completo administrativo, más \`/archived/\` y \`/restore/\` por heredar de \`AuditableViewSet\`.

# **19\. Borrado y restauración**

DELETE /api/platforms/12/  
{  
  "delete\_explanation": "Plataforma retirada"  
}

GET /api/platforms/archived/  
POST /api/platforms/12/restore/

* Cuando existen dependencias de negocio puede exigirse \`delete\_explanation\`.  
* La eliminación puede terminar en 204 si se elimina físicamente.  
* Si se aplica Soft Delete, responde 200 con \`{detail, permanent:false}\`.  
* Restaurar una plataforma fuerza \`status=borrador\` y limpia la validación.  
* Una plataforma restaurada debe pasar nuevamente por \`publish\`.

# **20\. API pública**

GET /api/platforms/public/  
GET /api/platforms/public/12/

Solo se exponen plataformas con \`status=publicado\` y no eliminadas.

| Filtro | Ejemplo | Descripción |
| :---- | :---- | :---- |
| institution | \`?institution=1\` | Institución activa relacionada. |
| country | \`?country=57\` | País activo relacionado. |
| language | \`?language=1\` | Idioma activo relacionado. |
| knowledge\_area | \`?knowledge\_area=3\` | Área activa relacionada. |
| material\_type | \`?material\_type=1\` | Tipo de material activo. |
| academic\_program | \`?academic\_program=8\` | Programa académico activo. |
| requires\_registration | \`?requires\_registration=true\` | Registro requerido. |
| has\_access\_text | \`?has\_access\_text=true\` | Texto completo. |
| search | \`?search=scopus\` | Busca por nombre. |
| ordering | \`?ordering=name\` | Ordena por nombre o períodos. |

# **21\. Respuesta pública de Platform**

{  
  "id": 12,  
  "name": "Scopus",  
  "base\_api\_url": "https\://api.example.org",  
  "url\_image": "https\://example.org/scopus.png",  
  "start\_period": "2010-01-01",  
  "finish\_period": null,  
  "requires\_registration": true,  
  "has\_access\_text": true,  
  "valid\_sintaxis": {  
    "name": "Sintaxis estándar",  
    "booleans": \["AND", "OR", "NOT"\],  
    "parenthesis": true,  
    "fields": {  
      "title": "ti",  
      "language": "la"  
    }  
  },  
  "institutions": \[  
    {"id": 1, "name": "Universidad"}  
  \],  
  "languages": \[  
    {"id": 1, "name": "Español", "abbreviation": "es"}  
  \],  
  "countries": \[  
    {"id": 57, "name": "Colombia", "abbreviation": "CO", "emoji\_flag": "🇨🇴"}  
  \],  
  "knowledge\_areas": \[  
    {"id": 3, "name": "Ciencias Naturales"}  
  \],  
  "material\_types": \[  
    {"id": 1, "name": "Revista"}  
  \],  
  "academic\_programs": \[  
    {"id": 8, "name": "Biología"}  
  \],  
  "link\_status": {  
    "is\_active": true,  
    "last\_check": "2026-10-01T10:00:00Z"  
  }  
}

La respuesta pública no expone \`api\_key\`, \`encrypted\_api\_key\`, campos de auditoría ni datos internos de validación.

# **22\. Flujo recomendado para el Frontend**

* Para el formulario de plataforma, cargar previamente instituciones, idiomas, países, áreas, tipos de material, programas y sintaxis.  
* Crear la plataforma y dejarla en \`borrador\`.  
* Validar que la ficha esté completa; si el usuario la quiere publicar, llamar a \`publish\`.  
* Si falla publicación, mostrar directamente los errores por campo que devuelve HTTP 400\.  
* Usar \`check-link\` para mostrar el estado técnico del enlace y el historial desde \`link-check-logs\`.  
* Para catálogo público usar exclusivamente \`/public/\`.  
* No mostrar ni almacenar en el estado de UI ningún valor de \`encrypted\_api\_key\`; \`api\_key\` solo debe enviarse al backend cuando sea necesario.

# **23\. Errores y estados HTTP**

HTTP 400  
{  
  "base\_api\_url": \[  
    "La plataforma debe tener una URL antes de publicarse."  
  \]  
}

HTTP 400  
{  
  "status": \[  
    "Solo una plataforma publicada puede marcarse como obsoleta."  
  \]  
}

HTTP 404  
{  
  "detail": "No existe un registro eliminado con ese id."  
}

# **24\. Contrato TypeScript de referencia**

export type PlatformStatus \=  
  | "borrador"  
  | "publicado"  
  | "obsoleto";

export interface PlatformPublic {  
  id: number;  
  name: string;  
  base\_api\_url: string | null;  
  url\_image: string | null;  
  start\_period: string | null;  
  finish\_period: string | null;  
  requires\_registration: boolean;  
  has\_access\_text: boolean;  
  valid\_sintaxis: ValidSintaxisPublic;  
  institutions: CatalogItem\[\];  
  languages: LanguageItem\[\];  
  countries: CountryItem\[\];  
  knowledge\_areas: CatalogItem\[\];  
  material\_types: CatalogItem\[\];  
  academic\_programs: CatalogItem\[\];  
  link\_status: {  
    is\_active: boolean | null;  
    last\_check: string | null;  
  };  
}

# **25\. Nota de fuente de verdad**

El contrato debe mantenerse sincronizado con \`/api/schema/\` y Swagger. El proyecto contiene archivos históricos de pruebas/documentación con estructuras anteriores; esta guía sigue la estructura actual de los serializers/modelos más recientes identificados en el proyecto.