// VARIABLES GLOBALES
let tokens = [] // Tokens generados por el lexer
let erroresLexicos = [] // Errores léxicos encontrados
let erroresSintacticos = [] // Errores sintácticos encontrados
let codigoPython = "" // Código Python traducido

//________________________________________________________________________________________
//referenciando elementos del DOM 
// Áreas de texto
const javaCodeArea = document.getElementById("java-code")
const pythonCodeArea = document.getElementById("python-code")

// Botones de acción
const translateBtn = document.getElementById("translate")
const viewTokensBtn = document.getElementById("view-tokens-btn")
const clearAllBtn = document.getElementById("clear-all-btn")
const openJavaBtn = document.getElementById("open-java-btn")
const saveJavaBtn = document.getElementById("save-java-btn")
const savePythonBtn = document.getElementById("save-python-btn")
const reporteTokensBtn = document.getElementById("reporte-tokens-btn")
const reporteLexicosBtn = document.getElementById("reporte-lexicos-btn")
const reporteSintacticosBtn = document.getElementById("reporte-sintacticos-btn")

// Elementos de estado
const statusMessage = document.getElementById("status-message")
const tokensCount = document.getElementById("tokens-count")

// Cuerpos de las tablas
const tokensBody = document.getElementById("tokens-body")
const lexicalErrorsBody = document.getElementById("lexical-errors-body")
const syntaxErrorsBody = document.getElementById("syntax-errors-body")

// Pestañas
const tabs = document.querySelectorAll(".tab")
const tabContents = document.querySelectorAll(".tab-content")
console.log(" main.js cargado correctamente")
//___________________________________________________________________________________________





//________________________________________________________________________________
// REGISTRO DE EVENT LISTENERS

// Botones principales
translateBtn.addEventListener("click", traducirCodigo)
viewTokensBtn.addEventListener("click", mostrarPestanaTokens)

// Event listener para abrir Java
if (openJavaBtn) {
  openJavaBtn.addEventListener("click", abrirArchivoJava)
  console.log(" Event listener para abrir Java registrado")
}

if (saveJavaBtn) {
  saveJavaBtn.addEventListener("click", guardarCodigoJava)
  console.log(" Event listener para guardar Java registrado")
}

if (savePythonBtn) {
  savePythonBtn.addEventListener("click", guardarCodigoPython)
  console.log(" Event listener para guardar Python registrado")
}

if (reporteTokensBtn) {
  reporteTokensBtn.addEventListener("click", generarReporteTokens)
  console.log(" Event listener para reporte tokens registrado")
}

if (reporteLexicosBtn) {
  reporteLexicosBtn.addEventListener("click", generarReporteErroresLexicos)
  console.log(" Event listener para reporte léxicos registrado")
}

if (reporteSintacticosBtn) {
  reporteSintacticosBtn.addEventListener("click", generarReporteErroresSintacticos)
  console.log(" Event listener para reporte sintácticos registrado")
}
if (clearAllBtn) {
  clearAllBtn.addEventListener("click", limpiarTodo)
}

// Pestañas de reportes
tabs.forEach((tab) => {
  tab.addEventListener("click", () => { //haciendo una acción al realizar un click en la pestaña
    const tabName = tab.getAttribute("data-tab")
    cambiarPestana(tabName)
  })
})

console.log(" Event listeners registrados")
//____________________________________________________________________________________________________________







//_______________________________________________________________________________________________________________________________
// FUNCIÓN PRINCIPAL DE TRADUCCIÓN
function traducirCodigo() {
  console.log(" Ejecutando traducción...")

  const codigo = javaCodeArea.value

  // Validar que haya código para traducir
  if (!codigo.trim()) {
    alert("Por favor, ingrese código Java para traducir") 
    return
  }

  // Actualizar estado de la interfaz
  statusMessage.textContent = "Analizando..."

  try {
    //analizando primeramente la parte léxica por medio de una instancia
    console.log(" Iniciando análisis léxico...")
    const lexer = window.lexer //importando lexer.js
    const analizadorLexico = new lexer(codigo) //instancia
    tokens = analizadorLexico.analizar() //analizando tokens por medio de la instancia
    erroresLexicos = analizadorLexico.error || [] //retornando errores o un arreglo vacío en caso de no haber 

    console.log(" Tokens encontrados:", tokens ? tokens.length : 0)
    console.log(" Errores léxicos:", erroresLexicos ? erroresLexicos.length : 0)

    if (!tokens || !Array.isArray(tokens)) { //si tokens es inválido o no existe, devuelve un array vacío 
      tokens = []
    }
    if (!erroresLexicos || !Array.isArray(erroresLexicos)) {
      erroresLexicos = []
    }

    // Actualizar contador de tokens en la interfaz
    tokensCount.textContent = tokens.length

    // Actualizar tablas de tokens y errores léxicos
    actualizarTablaTokens()
    actualizarTablaErroresLexicos()
//_________________________________________________________________________________________________________________________




//_______________________________________________________________________________________________________________________________
// PASO 2: ANÁLISIS SINTÁCTICO Y TRADUCCIÓN
    console.log(" Iniciando análisis sintáctico...")

    const Parser = window.Parser 
    const analizadorSintactico = new Parser(tokens) //instanciando el parser por medio de una objeto analizadorSintactico 
    const resultado = analizadorSintactico.analizar() 

    erroresSintacticos = resultado.errors || [] //retornando los errores o un arreglo vacío
    codigoPython = resultado.python || "" //retornando el código de salida o una expresión vacía 

    console.log(" Errores sintácticos:", erroresSintacticos.length)
    console.log(" Código Python generado:", codigoPython.length, "caracteres")

    // Actualizar tabla de errores sintácticos
    actualizarTablaErroresSintacticos()

    const totalErrores = erroresLexicos.length + erroresSintacticos.length 

    if (totalErrores > 0) {
      let mensajeError = ""
      let mensajeAlerta = "Se encontraron errores:\n"

      if (erroresLexicos.length > 0 && erroresSintacticos.length > 0) {
        mensajeError = `Hay ${erroresLexicos.length} errores léxicos y ${erroresSintacticos.length} errores sintácticos. Revisa las tablas de errores.`
        mensajeAlerta += `- ${erroresLexicos.length} errores léxicos\n- ${erroresSintacticos.length} errores sintácticos\n\nRevise las pestañas de errores.`
        statusMessage.textContent = "Error: Errores léxicos y sintácticos detectados" //mostrando en el txtArea
      } else if (erroresLexicos.length > 0) { //en caso de haber solamente errores léxicos
        mensajeError = `Hay ${erroresLexicos.length} errores léxicos. Revisa la tabla de errores léxicos.`
        mensajeAlerta += `- ${erroresLexicos.length} errores léxicos\n\nRevise la pestaña de errores léxicos.`
        statusMessage.textContent = "Error: Errores léxicos detectados"
      } else { //de lo contrario, hay errores sintácticos
        mensajeError = `Hay ${erroresSintacticos.length} errores sintácticos. Revisa la tabla de errores sintácticos.`
        mensajeAlerta += `- ${erroresSintacticos.length} errores sintácticos\n\nRevise la pestaña de errores sintácticos.`
        statusMessage.textContent = "Error: Errores sintácticos detectados"
      }

      pythonCodeArea.value = mensajeError //el código en python retornará el mensaje de error
      alert(mensajeAlerta) //mostrando un mensaje de alerta
      return //frenando la acción para no caer en un bucle infinito
    }
//__________________________________________________________________________________________________________________________________________




//___________________________________________________________________________________________________________
//MOSTRAR CÓDIGO TRADUCIDO

    pythonCodeArea.value = codigoPython //retornando las traducciones
    statusMessage.textContent = "Traducción exitosa" //mensaje que demustra traduccióne exitosa

    alert(`¡Traducción exitosa!\nTokens analizados: ${tokens.length}`)
  } catch (error) {
    // Manejo de errores del sistema
    console.error(" Error en traducción:", error)
    pythonCodeArea.value = "# Error del sistema: " + error.message
    statusMessage.textContent = "Error del sistema"
    alert("Error del sistema: " + error.message)
  }
//____________________________________________________________________________________________________________

} //fin del método principal de traducción
//_____________________________________________________________________________________________________________________






//_____________________________________________________________________________________________________________________
// FUNCIONES DE ACTUALIZACIÓN DE TABLAS





//______________________________________________________________________________________________________________________
//función para limpiar contenido
function limpiarTodo() {
  // Limpiar textareas
  javaCodeArea.value = ""
  pythonCodeArea.value = ""
  
  // Limpiar arrays de datos
  tokens = []
  erroresLexicos = []
  erroresSintacticos = []
  
  // Limpiar tablas
  actualizarTablaTokens()
  actualizarTablaErroresLexicos()
  actualizarTablaErroresSintacticos()
  
  // Resetear mensaje de estado
  statusMessage.textContent = "Listo para traducir"
  statusMessage.style.color = "#666"
  
  // Volver a la pestaña de tokens
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"))
  document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"))
  document.querySelector(".tab-btn").classList.add("active")
  document.getElementById("tokens-tab").classList.add("active")
  
  console.log("Aplicación limpiada completamente")
}
//_________________________________________________________________________________________________________________________





//función que actualiza la tabla de tokens
//__________________________________________________________________________________________________________________________
function actualizarTablaTokens() {
//sentencia cuando no hay tokens se muestra un mensaje alineado diciendo que no se han generado los tokens
  if (tokens.length === 0) {
    tokensBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No se han generado tokens</td></tr>'
    return
  }

  let html = ""
  tokens.forEach((token, index) => {
    //creando las filas de la tabla de tokens
    html += `
      <tr> 
        <td>${index + 1}</td>
        <td><code>${token.value}</code></td>
        <td>${token.type}</td>
        <td>${token.line}</td>
        <td>${token.column}</td>
      </tr>
    `
  })
  tokensBody.innerHTML = html //insertando los tokens en la tabla generada
} //fin de actualizarTablaTokens
//__________________________________________________________________________________________________________________________



//__________________________________________________________________________________________________________________________
//funcion que actualiza la tabla de Errores Léxicos (mismo funcionamiento que el método para actualizar la tabla de tokens)
function actualizarTablaErroresLexicos() {
  if (erroresLexicos.length === 0) {
    lexicalErrorsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay errores léxicos</td></tr>'
    return
  }

  let html = ""
  erroresLexicos.forEach((error, index) => {
    html += `
      <tr class="error-row">
        <td>${index + 1}</td>
        <td>${error.tipo}</td>
        <td>${error.descripcion}</td>
        <td>${error.linea}</td>
        <td>${error.columna}</td>
      </tr>
    `
  })
  lexicalErrorsBody.innerHTML = html
}
//__________________________________________________________________________________________________________________________






//__________________________________________________________________________________________________________________________
//funcion que actualiza la tabla de Errores Sintacticos (mismo funcionamiento que el método para actualizar la tabla de tokens)
function actualizarTablaErroresSintacticos() {
  if (erroresSintacticos.length === 0) {
    syntaxErrorsBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay errores sintácticos</td></tr>'
    return
  }

  let html = ""
  erroresSintacticos.forEach((error, index) => {
    html += `
      <tr class="error-row">
        <td>${index + 1}</td>
        <td>${error.tipo}</td>
        <td>${error.mensaje}</td>
        <td>${error.linea}</td>
        <td>${error.columna}</td>
      </tr>
    `
  })
  syntaxErrorsBody.innerHTML = html
}
//__________________________________________________________________________________________________________________________






//__________________________________________________________________________________________________________________________
// FUNCIONES DE NAVEGACIÓN DE PESTAÑAS
function cambiarPestana(tabName) {
  // Remover clase active de todas las pestañas
  tabs.forEach((tab) => tab.classList.remove("active"))
  tabContents.forEach((content) => content.classList.remove("active"))

  // Agregar clase active a la pestaña seleccionada
  const selectedTab = document.querySelector(`[data-tab="${tabName}"]`)
  const selectedContent = document.getElementById(`${tabName}-tab`)

  if (selectedTab && selectedContent) {
    selectedTab.classList.add("active")
    selectedContent.classList.add("active")
  }
}
//__________________________________________________________________________________________________________________________




//__________________________________________________________________________________________________________________________
function mostrarPestanaTokens() {
  // Verificar que haya datos para mostrar
  if (tokens.length === 0 && erroresLexicos.length === 0 && erroresSintacticos.length === 0) {
    alert("Primero debe generar la traducción")
    return
  }

  // Determinar qué pestaña mostrar según los errores encontrados
  if (erroresLexicos.length > 0) {
    cambiarPestana("lexical-errors")
  } else if (erroresSintacticos.length > 0) {
    cambiarPestana("syntax-errors")
  } else {
    cambiarPestana("tokens")
  }

  // Hacer scroll hacia la sección de reportes
  document.querySelector(".report-container").scrollIntoView({ behavior: "smooth" })
}
//__________________________________________________________________________________________________________________________




//__________________________________________________________________________________________________________________________
//funciones para el manejo de archivos de las traducciones y los reportes
function abrirArchivoJava() {
  console.log(" Abriendo archivo Java...")

  // Crear input file temporal
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".java"

  input.onchange = (e) => {
    const file = e.target.files[0] //obteniendo el primer archivo seleccionado
    if (!file) return //si no hay archivo, se retorna nulo

    const reader = new FileReader() //api para leer archivos del sistema
    reader.onload = (event) => { //evento de lectura del archivo por medio de la variable reader
      javaCodeArea.value = event.target.result //mostrando el código en el área de código JAVA
      statusMessage.textContent = `Archivo "${file.name}" cargado`
      console.log(" Archivo Java cargado:", file.name) //mensaje que se cargó correctamente
    }
    reader.onerror = () => {
      alert("Error al leer el archivo")
      console.error(" Error al leer archivo") //mensaje de error si no se lee el archivo
    }
    reader.readAsText(file)
  }

  input.click()
}
//_______________________________________________________________________________________________________________________-






//___________________________________________________________________________________________________
//acción para guardar el código de JAVA
function guardarCodigoJava() {
  console.log(" Guardando código Java...")

  if (!javaCodeArea.value.trim()) {
    alert("No hay código Java para guardar")
    return
  }

  const nombreArchivo = prompt("Ingrese el nombre del archivo (sin extensión):", "codigo")
  if (!nombreArchivo) return

  const blob = new Blob([javaCodeArea.value], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${nombreArchivo}.java`
  a.click()
  URL.revokeObjectURL(url)

  statusMessage.textContent = `Archivo "${nombreArchivo}.java" guardado`
  console.log(" Archivo Java guardado:", nombreArchivo)
}
//____________________________________________________________________________________________________





//______________________________________________________________________________________________________
//Guardar el código de Python traducido 
function guardarCodigoPython() {
  console.log(" Guardando código Python...")

  if (!pythonCodeArea.value.trim()) {
    alert("No hay código Python para guardar. Primero genere la traducción.") //validando si no hay código para traducir
    return
  }

  const nombreArchivo = prompt("Ingrese el nombre del archivo (sin extensión):", "traducido")
  if (!nombreArchivo) return

  const blob = new Blob([pythonCodeArea.value], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${nombreArchivo}.py`
  a.click()
  URL.revokeObjectURL(url)

  statusMessage.textContent = `Archivo "${nombreArchivo}.py" guardado`
  console.log(" Archivo Python guardado:", nombreArchivo)
}
//____________________________________________________________________________________________________________



//_____________________________________________________________________________________________________________
//funciones para generar los reportes html

//reporte de Tokens
function generarReporteTokens() {
  console.log(" Generando reporte de tokens...")

  if (tokens.length === 0) {
    alert("No hay tokens para generar el reporte. Primero genere la traducción.")
    return
  }

  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Tokens</title>
</head>
<body>
    <h1>Reporte de Tokens</h1>
    <p>Total de tokens: ${tokens.length}</p>
    <table border="1" cellpadding="5" cellspacing="0">
        <thead>
            <tr>
                <th>No.</th>
                <th>Lexema</th>
                <th>Tipo</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
`

  tokens.forEach((token, index) => {
    html += `
            <tr>
                <td>${index + 1}</td>
                <td>${token.value}</td>
                <td>${token.type}</td>
                <td>${token.line}</td>
                <td>${token.column}</td>
            </tr>
`
  })

  html += `
        </tbody>
    </table>
</body>
</html>
`

  descargarReporteHTML(html, "reporte_tokens.html")
  console.log(" Reporte de tokens generado")
}
//_______________________________________________________________________________________________




//_______________________________________________________________________________________________
//generación de reporte de errores léxicos
function generarReporteErroresLexicos() {
  console.log(" Generando reporte de errores léxicos...")

  if (erroresLexicos.length === 0) {
    alert("No hay errores léxicos para generar el reporte.")
    return
  }

  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Errores Léxicos</title>
</head>
<body>
    <h1>Reporte de Errores Léxicos</h1>
    <p>Total de errores: ${erroresLexicos.length}</p>
    <table border="1" cellpadding="5" cellspacing="0">
        <thead>
            <tr>
                <th>No.</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
`

  erroresLexicos.forEach((error, index) => {
    html += `
            <tr>
                <td>${index + 1}</td>
                <td>${error.tipo}</td>
                <td>${error.descripcion}</td>
                <td>${error.linea}</td>
                <td>${error.columna}</td>
            </tr>
`
  })

  html += `
        </tbody>
    </table>
</body>
</html>
`

  descargarReporteHTML(html, "reporte_errores_lexicos.html")
  console.log(" Reporte de errores léxicos generado")
}
//_______________________________________________________________________________________________






//_______________________________________________________________________________________________
//generación de reportes de errores sintácticos
function generarReporteErroresSintacticos() {
  console.log(" Generando reporte de errores sintácticos...")

  if (erroresSintacticos.length === 0) {
    alert("No hay errores sintácticos para generar el reporte.")
    return
  }

  let html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Errores Sintácticos</title>
</head>
<body>
    <h1>Reporte de Errores Sintácticos</h1>
    <p>Total de errores: ${erroresSintacticos.length}</p>
    <table border="1" cellpadding="5" cellspacing="0">
        <thead>
            <tr>
                <th>No.</th>
                <th>Tipo</th>
                <th>Mensaje</th>
                <th>Línea</th>
                <th>Columna</th>
            </tr>
        </thead>
        <tbody>
`

  erroresSintacticos.forEach((error, index) => {
    html += `
            <tr>
                <td>${index + 1}</td>
                <td>${error.tipo}</td>
                <td>${error.mensaje}</td>
                <td>${error.linea}</td>
                <td>${error.columna}</td>
            </tr>
`
  })

  html += `
        </tbody>
    </table>
</body>
</html>
`

  descargarReporteHTML(html, "reporte_errores_sintacticos.html")
  console.log(" Reporte de errores sintácticos generado")
}
//_________________________________________________________________________________________________





//___________________________________________________________________________________________________
//funcion para descargar los reportes
function descargarReporteHTML(html, nombreArchivo) {
  console.log(" Descargando reporte:", nombreArchivo)

  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)

  statusMessage.textContent = `Reporte "${nombreArchivo}" generado`
}

//_______________________________________________________________________________________________


console.log(" Todas las funciones cargadas correctamente")
