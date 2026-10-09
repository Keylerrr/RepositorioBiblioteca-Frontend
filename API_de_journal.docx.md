**API de JOURNAL**

**Revistas académicas**

*Contrato de integración para Frontend — Fase A*

# **1\. Objetivo y alcance**

Este documento define el contrato HTTP que debe utilizar el Frontend para consumir la API de \`journal\`. Incluye rutas, métodos, parámetros, cuerpos de solicitud, respuestas, paginación, filtros, ordenamiento, reglas de negocio, estados, eliminación lógica, restauración y ejemplos. La documentación se basa en los serializers, viewsets, filtros, modelos y servicios disponibles en el proyecto.

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
| Revistas administrativas | /api/journals/ | GET, POST |
| Revista individual | /api/journals/{id}/ | GET, PUT, PATCH, DELETE |
| Revistas archivadas | /api/journals/archived/ | GET |
| Restaurar revista | /api/journals/{id}/restore/ | POST |
| Publicar/validar | /api/journals/{id}/publish/ | POST |
| Desactivar | /api/journals/{id}/deactivate/ | POST |
| Exploración pública | /api/journals/public/ | GET |
| Detalle público | /api/journals/public/{id}/ | GET |

# **7\. Modelo administrativo: campos**

| Campo | Tipo | Entrada | Descripción / regla |
| :---- | :---- | :---- | :---- |
| issn | string | Lectura/escritura | ISSN digital. Formato normalizado \`XXXX-XXXX\`. Identificador de deduplicación. |
| title | string | Lectura/escritura | Título de la revista; máximo 500 caracteres. |
| editorial | integer|null | Lectura/escritura | ID de Editorial. |
| license | string|null | Lectura/escritura | Licencia de distribución; máximo 255\. |
| url\_image | string|null | Lectura/escritura | URL de imagen/logotipo; máximo 500\. |
| has\_apc | boolean | Lectura/escritura | Indica si cobra APC. Default: \`false\`. |
| active | boolean | Solo lectura | Estado de disponibilidad. Se cambia mediante publish/deactivate. |
| start\_period | date|null | Lectura/escritura | Inicio de cobertura. |
| finish\_period | date|null | Lectura/escritura | Fin de cobertura; puede quedar \`null\`. |
| validated\_by | integer|null | Solo lectura | Usuario que realizó la validación/publicación. |
| validated\_at | datetime|null | Solo lectura | Fecha/hora de validación. |
| fetched\_at | datetime|null | Solo lectura | Última obtención/actualización por cosecha. |
| languages | integer\[\] | Escritura; IDs | IDs de idiomas. |
| countries | integer\[\] | Escritura; IDs | IDs de países. |
| knowledge\_areas | integer\[\] | Escritura; IDs | IDs de áreas del conocimiento. |
| material\_types | integer\[\] | Escritura; IDs | IDs de tipos de material. |
| academic\_programs | integer\[\] | Escritura; IDs | IDs de programas académicos. |
| platforms | object\[\] | Escritura | Relación enriquecida revista-plataforma. |

# **8\. ISSN: normalización y deduplicación**

* El backend admite el ISSN con o sin guion y elimina espacios.  
* Se convierte a mayúsculas.  
* La representación final es \`XXXX-XXXX\`.  
* Los primeros 7 caracteres deben ser numéricos y el último puede ser número o \`X\`.  
* Existe una restricción de unicidad case-insensitive sobre \`issn\`.  
* No debe existir más de una revista activa con el mismo ISSN.

Entrada:  
"00288336"

Resultado almacenado:  
"0028-8336"

Si el ISSN es inválido, el backend responde 400 con un error asociado al campo \`issn\`.

# **9\. Relación \`platforms\` en una revista**

El Frontend debe enviar cada vínculo como objeto:

"platforms": \[  
  {  
    "platform": 12,  
    "start\_period": "2020-01-01",  
    "finish\_period": "2025-12-31",  
    "has\_full\_text": true  
  },  
  {  
    "platform": 15,  
    "start\_period": "2022-01-01",  
    "finish\_period": null,  
    "has\_full\_text": false  
  }  
\]

| Campo | Tipo | Obligatorio | Regla |
| :---- | :---- | :---- | :---- |
| platform | integer | Sí | ID de Platform existente. |
| start\_period | date|null | No | Inicio de cobertura en esa plataforma. |
| finish\_period | date|null | No | No puede ser anterior a \`start\_period\`. |
| has\_full\_text | boolean | No | Default \`false\`. |

* Una misma plataforma no puede aparecer dos veces en el mismo payload.  
* Si la relación ya existe, sus fechas/atributos pueden actualizarse.  
* Si se elimina del arreglo enviado, la relación activa se marca mediante Soft Delete.  
* Si el campo \`platforms\` se omite, no se modifica la relación.  
* Una lista vacía explícita elimina las relaciones activas de esa colección.

# **10\. Respuesta administrativa de una revista**

{  
  "id": 1,  
  "issn": "0028-0836",  
  "title": "Nature",  
  "editorial": 4,  
  "license": "CC BY",  
  "url\_image": "https\://example.org/nature.jpg",  
  "has\_apc": false,  
  "active": true,  
  "start\_period": "1869-01-01",  
  "finish\_period": null,  
  "validated\_by": 0,  
  "validated\_at": "2026-10-01T10:00:00Z",  
  "fetched\_at": null,  
  "languages": \[1, 2\],  
  "countries": \[57\],  
  "knowledge\_areas": \[3\],  
  "material\_types": \[1\],  
  "academic\_programs": \[8\],  
  "platforms": \[  
    {  
      "platform": 12,  
      "start\_period": "2020-01-01",  
      "finish\_period": null,  
      "has\_full\_text": true  
    }  
  \]  
}

# **11\. Crear revista — POST**

POST /api/journals/  
Content-Type: application/json

{  
  "issn": "0028-0836",  
  "title": "Nature",  
  "editorial": 4,  
  "license": "CC BY",  
  "url\_image": "https\://example.org/nature.jpg",  
  "has\_apc": false,  
  "start\_period": "1869-01-01",  
  "languages": \[1\],  
  "countries": \[57\],  
  "knowledge\_areas": \[3\],  
  "material\_types": \[1\],  
  "academic\_programs": \[8\],  
  "platforms": \[  
    {  
      "platform": 12,  
      "start\_period": "2020-01-01",  
      "has\_full\_text": true  
    }  
  \]  
}

Respuesta esperada: HTTP 201 con la representación administrativa.

# **12\. Listar revistas — GET**

GET /api/journals/

Filtros administrativos:

| Parámetro | Ejemplo | Función |
| :---- | :---- | :---- |
| editorial | \`?editorial=4\` | Filtra por ID de editorial. |
| has\_apc | \`?has\_apc=true\` | Filtra por APC. |
| active | \`?active=false\` | Filtra por estado activo/inactivo. |
| search | \`?search=nature\` | Busca en \`title\` e \`issn\`. |
| ordering | \`?ordering=title\` | Orden ascendente. |
| ordering | \`?ordering=-title\` | Orden descendente. |
| page | \`?page=2\` | Página. |
| page\_size | \`?page\_size=50\` | Tamaño de página, máximo 100\. |

# **13\. Consultar, actualizar y eliminar**

GET /api/journals/1/

PUT /api/journals/1/  
{  
  "issn": "0028-0836",  
  "title": "Nature",  
  "editorial": 4  
}

PATCH /api/journals/1/  
{  
  "title": "Nature Journal"  
}

La actualización de una revista elimina su validación previa (\`validated\_by\`/\`validated\_at\`) cuando la ficha cambia; deberá validarse nuevamente para volver a aparecer en el catálogo público.

# **14\. Eliminación y restauración**

DELETE /api/journals/1/  
Content-Type: application/json

{  
  "delete\_explanation": "Revista retirada del catálogo"  
}

* Si existen dependencias de negocio, el backend exige \`delete\_explanation\`.  
* Si puede eliminarse físicamente, puede responder HTTP 204 sin contenido.  
* Si se realiza Soft Delete, responde HTTP 200 con \`{detail, permanent:false}\`.  
* Los registros eliminados aparecen en \`/api/journals/archived/\`.  
* Para restaurar: \`POST /api/journals/{id}/restore/\`.  
* Una revista restaurada pierde su validación y debe publicarse nuevamente.

GET /api/journals/archived/

POST /api/journals/1/restore/

# **15\. Publicación y desactivación**

POST /api/journals/1/publish/  
POST /api/journals/1/deactivate/

* \`publish\` establece \`active=true\`, asigna \`validated\_by\` y \`validated\_at\` y actualiza auditoría.  
* \`deactivate\` establece \`active=false\`.  
* El endpoint público requiere \`active=true\` y \`validated\_at\` no nulo.  
* Modificar una ficha administrativa limpia la validación previa; esto obliga a publicar nuevamente.

# **16\. API pública**

GET /api/journals/public/  
GET /api/journals/public/1/

Solo se exponen revistas activas y con validación registrada.

| Filtro | Ejemplo | Descripción |
| :---- | :---- | :---- |
| issn | \`?issn=00288336\` | Acepta ISSN con o sin guion. |
| title | \`?title=nature\` | Contiene texto en el título. |
| editorial | \`?editorial=4\` | ID de editorial activa. |
| language | \`?language=1\` | ID de idioma activo. |
| country | \`?country=57\` | ID de país activo. |
| knowledge\_area | \`?knowledge\_area=3\` | ID de área activa. |
| material\_type | \`?material\_type=1\` | ID de tipo de material activo. |
| academic\_program | \`?academic\_program=8\` | ID de programa académico activo. |
| platform | \`?platform=12\` | ID de plataforma según relación activa. |
| has\_apc | \`?has\_apc=false\` | APC. |
| start\_period\_from | \`?start\_period\_from=2020-01-01\` | Inicio \>= fecha. |
| start\_period\_to | \`?start\_period\_to=2026-01-01\` | Inicio \<= fecha. |
| finish\_period\_from | \`?finish\_period\_from=2020-01-01\` | Fin \>= fecha. |
| finish\_period\_to | \`?finish\_period\_to=2026-01-01\` | Fin \<= fecha. |
| search | \`?search=nature\` | Busca título/ISSN. |
| ordering | \`?ordering=title\` | Ordena por título, ISSN o períodos. |

# **17\. Respuesta pública**

{  
  "id": 1,  
  "issn": "0028-0836",  
  "title": "Nature",  
  "editorial\_name": "Nature Publishing",  
  "license": "CC BY",  
  "url\_image": "https\://example.org/nature.jpg",  
  "has\_apc": false,  
  "active": true,  
  "start\_period": "1869-01-01",  
  "finish\_period": null,  
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
  "platforms": \[  
    {  
      "id": 12,  
      "name": "Scopus",  
      "base\_api\_url": "https\://api.example.org",  
      "start\_period": "2020-01-01",  
      "finish\_period": null,  
      "has\_full\_text": true  
    }  
  \]  
}

# **18\. Flujo recomendado para el Frontend**

* Para administración: cargar \`/api/journals/\` y los catálogos necesarios para construir formularios.  
* Para crear: enviar IDs de catálogos y objetos de \`platforms\`.  
* Después de crear/modificar: si la ficha debe ser visible públicamente, ejecutar \`publish\`.  
* Para edición de relaciones: enviar la colección completa solo cuando se quiera sincronizar esa relación.  
* Para consulta pública: usar \`/api/journals/public/\`; no intentar filtrar manualmente por \`active\`/\`validated\_at\`.  
* Para paginación: preferir \`next\`/\`previous\` del backend, conservando los parámetros de filtro.

# **19\. Ejemplos de errores**

HTTP 400  
{  
  "issn": \["El ISSN debe tener el formato XXXX-XXXX."\]  
}

HTTP 400  
{  
  "finish\_period": \[  
    "El período final no puede ser anterior al período inicial."  
  \]  
}

HTTP 404  
{  
  "detail": "No existe una revista eliminada con ese id."  
}

# **20\. Nota de implementación**

El esquema OpenAPI generado por el backend debe mantenerse sincronizado con esta guía. Si Swagger muestra una diferencia frente a este documento, debe revisarse primero la versión de código integrada antes de que el Frontend codifique una nueva estructura.