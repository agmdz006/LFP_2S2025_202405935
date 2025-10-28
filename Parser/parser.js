//_______________________________________________________________________________________________
//clase de errores sintácticos
class ErroresSin {
  constructor(tipo, valor, mensaje, linea, columna) {
    this.tipo = tipo
    this.valor = valor
    this.mensaje = mensaje
    this.linea = linea
    this.columna = columna
  }
}
//_______________________________________________________________________________________________



class Parser {
//_______________________________________________________________________________________________

//constructor de clase Parser
  constructor(tokens) {
    this.tokens = tokens // Tokens a analizar
    this.pos = 0 // Posición actual en el array de tokens
    this.errors = [] // Array de errores sintácticos encontrados
    this.pythonCode = "" // Código Python generado
    this.indent = "" // Indentación actual 
  }
  //_______________________________________________________________________________________________



  //_______________________________________________________________________________________________
  //función analizar clase (estructura de clase) si hay, de lo contrario, analiza fragmentos de código
  analizar() {
    // Verificar si el código comienza con "public class" (estructura completa)
    if (this.tokens[0] && this.tokens[0].type === "PUBLIC") {
      // Modo con estructura de clase completa
      return this.analizarConClase() //análisis en caso de que sí venga una estructura de clase 
    } else {
      // Modo sin estructura de clase (solo sentencias)
      return this.analizarSinClase()
    }
  }
  //_______________________________________________________________________________________________




//_______________________________________________________________________________________________
//analizando estructura con clase 
  analizarConClase() {
    // 1. Verificar "public"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "PUBLIC") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'public' al inicio del archivo. El archivo debe comenzar con 'public class NombreClase'",
          token?.line || 1,
          token?.column || 1,),)
      return { errors: this.errors, python: this.pythonCode }
    }
    this.pos++ //avanza a "class"




    // 2. Verificar "class"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "CLASS") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'class' después de 'public'",
          token?.line || 1,
          token?.column || 1,
        ),)
      return { errors: this.errors, python: this.pythonCode }
    }
    this.pos++ //avanza al nombre de cla clase 




    // 3. Verificar nombre de la clase (identificador)
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "IDENTIFICADOR") { //si no existe un token en la pos actual ni su valor es un identificador se pushea error
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba el nombre de la clase después de 'class'",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return { errors: this.errors, python: this.pythonCode } //se retorna el error
    }
    const nombreClase = this.tokens[this.pos].value  //el identificador se almacena en nombreClsae
    this.pos++ //avanza en los tokens

    this.pythonCode += `class ${nombreClase}:\n` //parte traducida a python + incremento de identación
    // Incrementar indentación para todo el contenido de la clase
    this.indent += "    "



    // 4. Verificar llave de apertura de la clase
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "{") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          `Se esperaba '{' después del nombre de la clase '${nombreClase}'`,
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return { errors: this.errors, python: this.pythonCode }
    }
    this.pos++ //avanzando al siguiente token



    // 5. Verificar "public static void main(String[] args) {"
    if (!this.validarMetodoMain()) { 
      return { errors: this.errors, python: this.pythonCode }
    }

    // 6. Procesar el contenido del método main
    this.procesarSentencias() //método que contiene un switch and case para varios casos de sentencias

    // 7. Verificar llave de cierre del método main
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "}") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba '}' para cerrar el método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return { errors: this.errors, python: this.pythonCode }
    }
    this.pos++

    this.indent = this.indent.slice(0, -4)





    // 8. Verificar llave de cierre de la clase
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "}") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba '}' para cerrar la clase",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return { errors: this.errors, python: this.pythonCode }
    }
    this.pos++




    if (this.pos < this.tokens.length) { //validando que no hayan instrucciones fuera de la clase (después de la llave de cierre)
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token.value,
          `Token inesperado '${token.value}' después del cierre de la clase. No se permiten sentencias fuera de la clase`,
          token.line,
          token.column,
        ),
      )
    }

    return { errors: this.errors, python: this.pythonCode }
  }
//___________________________________________________________________________________________________________________________________________




//___________________________________________________________________________________________________________________________________________
//en caso de solo traducir un fragmento, se usa un método simple que tiene la traducción de las sentencias
  analizarSinClase() {
    // Procesar todas las sentencias directamente
    this.procesarSentencias()
    return { errors: this.errors, python: this.pythonCode }
  }
//___________________________________________________________________________________________________________________________________________




//___________________________________________________________________________________________________________________________________________
//método para procesar sentencias de código por medio de un switch con varios casos de estructuras de control
procesarSentencias() {
  while (this.pos < this.tokens.length && this.tokens[this.pos].value !== "}") {
    const token = this.tokens[this.pos]

    // <CHANGE> Agregar manejo explícito de comentarios al inicio
    if (token.type === "COMMENT_LINE" || token.type === "COMMENT_BLOCK") {
      this.traducirComentario()
      continue
    }

    switch (token.type) {
      case "INT_TYPE":
      case "DOUBLE_TYPE":
      case "CHAR_TYPE":
      case "STRING_TYPE":
      case "BOOLEAN_TYPE":
        this.declaracionVariable()
        break
      case "IF":
        this.traducirIf()
        break
      case "FOR":
        this.traducirFor()
        break
      case "WHILE":
        this.traducirWhile()
        break
      case "SYSTEM":
        this.traducirPrint()
        break
      case "IDENTIFICADOR":
        this.traducirAsignacionOIncremento()
        break
      default:
        this.errors.push(
          new ErroresSin("SINTACTICO", token.value, `Token inesperado '${token.value}'. Se esperaba una declaración de variable, estructura de control (if, for, while) o System.out.println`, token.line, token.column),
        )
        this.pos++
        break
    }
  }
}
  //__________________________________________________________________________________________________________________________________



//__________________________________________________________________________________________________________________________________
//método encargado de validar la estrucura main de la clase 
  validarMetodoMain() {
    const inicioMain = this.pos

    // Verificar "public"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "PUBLIC") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'public' al inicio del método main. La firma correcta es: public static void main(String[] args)",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "static"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "STATIC") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'static' después de 'public' en el método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "void"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "VOID") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'void' después de 'static' en el método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "main"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "MAIN") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'main' después de 'void'",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "("
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "(") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba '(' después de 'main'",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "String"
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "STRING_TYPE") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'String' en los parámetros del método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "["
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "[") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba '[' después de 'String' en el método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "]"
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "]") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba ']' después de '[' en el método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "args" (identificador)
    if (!this.tokens[this.pos] || this.tokens[this.pos].type !== "ARGS") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba 'args' como nombre del parámetro en el método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar ")"
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ")") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba ')' para cerrar los parámetros del método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    // Verificar "{"
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "{") {
      const token = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          token?.value || "EOF",
          "Se esperaba '{' para iniciar el cuerpo del método main",
          token?.line || 1,
          token?.column || 1,
        ),
      )
      return false
    }
    this.pos++

    return true
  }
//__________________________________________________________________________________________________________________________________





//__________________________________________________________________________________________________________________________________
//clase encargada de traducir variables de tipo String
  traducirString(valor, tipo) {
    // Eliminar comillas si ya las tiene
    let contenido = valor //el contenido va a ser el valor que almacena la variable de tipo string
    if (contenido.startsWith('"') && contenido.endsWith('"')) {
      contenido = contenido.slice(1, -1)
    } else if (contenido.startsWith("'") && contenido.endsWith("'")) {
      contenido = contenido.slice(1, -1)
    }

    // Procesar secuencias de escape carácter por carácter 
    let resultado = ""
    let i = 0
    while (i < contenido.length) {
      if (contenido[i] === "\\" && i + 1 < contenido.length) {
        // Detectar secuencia de escape
        const siguienteChar = contenido[i + 1]
        if (siguienteChar === "n") {
          resultado += "\n" // Nueva línea
          i += 2
        } else if (siguienteChar === "t") {
          resultado += "\t" // Tabulación
          i += 2
        } else if (siguienteChar === "r") {
          resultado += "\r" // Retorno de carro
          i += 2
        } else if (siguienteChar === '"') {
          resultado += '"' // Comilla doble escapada
          i += 2
        } else if (siguienteChar === "'") {
          resultado += "'" // Comilla simple escapada
          i += 2
        } else if (siguienteChar === "\\") {
          resultado += "\\" // Barra invertida escapada
          i += 2
        } else {
          // Si no es una secuencia reconocida, mantener el carácter
          resultado += contenido[i]
          i++
        }
      } else {
        // Carácter normal
        resultado += contenido[i]
        i++
      }
    }

    // Retornar con el formato apropiado para Python
    if (tipo === "CHAR") {
      return `'${resultado}'` // Chars usan comillas simples
    } else {
      return `"${resultado}"` // Strings usan comillas dobles
    }
  }
  //________________________________________________________________________________________________________




//________________________________________________________________________________________________________
//método que traduce y analiza los tokens de las declaraciones de variables 
  declaracionVariable() {
    const tipo = this.tokens[this.pos].type
    this.pos++

    // Obtener el identificador (nombre de la variable)
    const id = this.tokens[this.pos]

    if (!id || id.type !== "IDENTIFICADOR") {
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          id?.value || "EOF",
          "Se esperaba un identificador",
          id?.line || 0,
          id?.column || 0,
        ),
      )
      return
    }
    this.pos++

    // Verificar el signo de asignación
    const igual = this.tokens[this.pos]
    if (!igual || igual.value !== "=") {
      this.errors.push(
        new ErroresSin("SINTACTICO", igual?.value || "EOF", "Se esperaba '='", igual?.line || 0, igual?.column || 0),
      )
      return
    }
    this.pos++

    let expresion = ""

    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ";") {
      const token = this.tokens[this.pos]

      // Traducir valores booleanos
      if (token.type === "TRUE") {
        expresion += "True "
      } else if (token.type === "FALSE") {
        expresion += "False "
      }
      // Traducir strings y chars
      else if (token.type === "STRING") {
        expresion += this.traducirString(token.value, "STRING") + " "
      } else if (token.type === "CHAR") {
        expresion += this.traducirString(token.value, "CHAR") + " "
      }
      // Agregar cualquier otro token (números, identificadores, operadores)
      else {
        expresion += token.value + " "
      }

      this.pos++
    }

    // Verificar que se encontró la expresión
    if (expresion.trim() === "") {
      this.errors.push(new ErroresSin("SINTACTICO", "EOF", "Falta valor en asignación", id.line, id.column))
      return
    }

    // Generación de la traducción de asignación de una variable
    this.pythonCode += `${this.indent}${id.value} = ${expresion.trim()}\n`

    // Verificar punto y coma final
    const fin = this.tokens[this.pos]
    if (fin && fin.value === ";") this.pos++
    else this.errors.push(new ErroresSin("SINTACTICO", fin?.value || "EOF", "Se esperaba ';'", id.line, id.column))
  }
  //________________________________________________________________________________________________________





//________________________________________________________________________________________________________
//método encargado de traducir una estrucura de control IF
  traducirIf() {
    const ifToken = this.tokens[this.pos] //el token actual se almacenará en una variable llamada ifToken
    this.pos++ //avanza a ' ( '

    // Verificar paréntesis de apertura
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "(") {
      const currentToken = this.tokens[this.pos] 
      this.errors.push(
        new ErroresSin("SINTACTICO",currentToken?.value || "EOF",
            "Se esperaba '(' después de 'if'",
            currentToken?.line || ifToken.line,
            currentToken?.column || ifToken.column,),)
      return
      }
    this.pos++
    let condicion = ""

    // Leer la condición hasta encontrar el paréntesis de cierre
    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ")") {
      const token = this.tokens[this.pos]

      if (token.type === "CHAR") {
        condicion += this.traducirString(token.value, "CHAR") + " "
      } else if (token.type === "STRING") {
        condicion += this.traducirString(token.value, "STRING") + " "
      } else if (token.type === "TRUE") {
        condicion += "True "
      } else if (token.type === "FALSE") {
        condicion += "False "
      } else {
        const val = token.value
        // Evitar duplicar el operador ==
        if (val === "=" && condicion.trim().endsWith("=")) {
          this.pos++
          continue
        }
        condicion += val + " "
      }
      this.pos++
    }

    // Verificar paréntesis de cierre
    if (this.tokens[this.pos]?.value !== ")") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ')' para cerrar la condición del if",
          currentToken?.line || ifToken.line,
          currentToken?.column || ifToken.column,
        ),
      )
      return
    }
    this.pos++

    // Generar código Python para el if
    this.pythonCode += `${this.indent}if ${condicion.trim()}:\n`

    // Verificar llave de apertura del bloque
    if (this.tokens[this.pos]?.value !== "{") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin("SINTACTICO",currentToken?.value || "EOF",
            "Se esperaba '{' para iniciar el bloque del if",
            currentToken?.line || ifToken.line,
            currentToken?.column || ifToken.column,),)
      return
    }
    this.pos++

    // Incrementar indentación para el bloque
    this.indent += "    "

    // Procesar el contenido del bloque if
    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== "}") {
      this.traducirLineaBloque()
    }

    // Restaurar indentación
    this.indent = this.indent.slice(0, -4)

    // Verificar llave de cierre del bloque if
    if (this.tokens[this.pos]?.value !== "}") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(new ErroresSin("SINTACTICO",currentToken?.value || "EOF",
        "Se esperaba '}' para cerrar el bloque del if",
        currentToken?.line || ifToken.line,
        currentToken?.column || ifToken.column,),)
      return
    }
    this.pos++ //avanza a un ' ELSE ' en caso de que venga

    // Verificar si hay un bloque else
    if (this.tokens[this.pos]?.type === "ELSE") {
      const elseToken = this.tokens[this.pos]
      this.pos++ //avanza a ' { '

      // Verificar llave de apertura del else
      if (this.tokens[this.pos]?.value !== "{") {
        const currentToken = this.tokens[this.pos]
        this.errors.push(
          new ErroresSin("SINTACTICO",currentToken?.value || "EOF",
            "Se esperaba '{' después de 'else'",
            currentToken?.line || elseToken.line,
            currentToken?.column || elseToken.column,),)
        return
      }

      this.pos++
      this.pythonCode += `${this.indent}else:\n`

      // Incrementar indentación para el bloque else
      this.indent += "    "

      // Procesar el contenido del bloque else
      while (this.pos < this.tokens.length && this.tokens[this.pos].value !== "}") { //mientras el token no sea un ' } ' se traduce el bloque
        this.traducirLineaBloque()
      }

      // Restaurar indentación
      this.indent = this.indent.slice(0, -4) //restaurando identación a 0 espacios

      // Verificar llave de cierre del bloque else
      if (this.tokens[this.pos]?.value === "}") this.pos++
      else {
        const currentToken = this.tokens[this.pos]
        this.errors.push(new ErroresSin("SINTACTICO",currentToken?.value || "EOF","Se esperaba '}' para cerrar el bloque del else",currentToken?.line || elseToken.line,currentToken?.column || elseToken.column,),)
      }
    }
  }
  //________________________________________________________________________________________________________




 //________________________________________________________________________________________________________
//método el cual se encarga de traducir la estructura FOR
    traducirFor() {
    const forToken = this.tokens[this.pos]
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "(") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '('",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    const tipo = this.tokens[this.pos]
    if (!tipo || (tipo.type !== "INT_TYPE" && tipo.type !== "DOUBLE_TYPE")) {
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          tipo?.value || "EOF",
          "Se esperaba tipo de variable",
          tipo?.line || forToken.line,
          tipo?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    const variable = this.tokens[this.pos]
    if (!variable || variable.type !== "IDENTIFICADOR") {
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          variable?.value || "EOF",
          "Se esperaba un identificador",
          variable?.line || forToken.line,
          variable?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "=") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '='",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    const inicio = this.tokens[this.pos]
    if (!inicio) {
      this.errors.push(
        new ErroresSin("SINTACTICO", "EOF", "Se esperaba un valor inicial", forToken.line, forToken.column),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ";") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ';'",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    const condVar = this.tokens[this.pos]
    if (!condVar) {
      this.errors.push(new ErroresSin("SINTACTICO", "EOF", "Se esperaba una variable", forToken.line, forToken.column))
      return
    }
    this.pos++

    const operador = this.tokens[this.pos]
    if (!operador) {
      this.errors.push(new ErroresSin("SINTACTICO", "EOF", "Se esperaba un operador", forToken.line, forToken.column))
      return
    }
    this.pos++

    const limite = this.tokens[this.pos]
    if (!limite) {
      this.errors.push(
        new ErroresSin("SINTACTICO", "EOF", "Se esperaba un valor limite", forToken.line, forToken.column),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ";") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ';'",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    const incVar = this.tokens[this.pos]
    if (!incVar) {
      this.errors.push(new ErroresSin("SINTACTICO", "EOF", "Se esperaba una variable", forToken.line, forToken.column))
      return
    }
    this.pos++

    if (this.tokens[this.pos]?.type === "INCREMENTO") this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ")") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ')'",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "{") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '{'",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
      return
    }
    this.pos++

    this.pythonCode += `${this.indent}${variable.value} = ${inicio.value}\n`
    this.pythonCode += `${this.indent}while ${condVar.value} ${operador.value} ${limite.value}:\n`
    this.indent += "    "

    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== "}") {
      this.traducirLineaBloque()
    }

    this.pythonCode += `${this.indent}${incVar.value} += 1\n`
    this.indent = this.indent.slice(0, -4)

    if (this.tokens[this.pos]?.value === "}") this.pos++
    else {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '}'",
          currentToken?.line || forToken.line,
          currentToken?.column || forToken.column,
        ),
      )
    }
  }
 //________________________________________________________________________________________________________




 //________________________________________________________________________________________________________
 //método para traducir los valores de tipo string
  traducirPrint() {
    const systemToken = this.tokens[this.pos]
    this.pos++

    // Verificar la secuencia completa: System.out.println()
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ".") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '.' después de 'System'",
          currentToken?.line || systemToken.line,
          currentToken?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "out") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba 'out' después de 'System.'",
          currentToken?.line || systemToken.line,
          currentToken?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ".") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '.' después de 'System.out'",
          currentToken?.line || systemToken.line,
          currentToken?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    const println = this.tokens[this.pos]
    if (!println || println.value !== "println") {
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          println?.value || "EOF",
          "Se esperaba 'println' después de 'System.out.'",
          println?.line || systemToken.line,
          println?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    // Verificar paréntesis de apertura
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "(") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '(' después de 'println'",
          currentToken?.line || systemToken.line,
          currentToken?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    // Leer el contenido a imprimir
    let contenido = ""
    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ")") {
      const tok = this.tokens[this.pos]

      // Traducir strings y chars correctamente
      if (tok.type === "STRING") {
        contenido += this.traducirString(tok.value, "STRING") + " "
      } else if (tok.type === "CHAR") {
        contenido += this.traducirString(tok.value, "CHAR") + " "
      } else {
        contenido += tok.value + " "
      }
      this.pos++
    }

    // Verificar paréntesis de cierre
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ")") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ')' para cerrar System.out.println",
          currentToken?.line || systemToken.line,
          currentToken?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ";") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ';' después de System.out.println()",
          currentToken?.line || systemToken.line,
          currentToken?.column || systemToken.column,
        ),
      )
      return
    }
    this.pos++

    // Generar código Python
    this.pythonCode += `${this.indent}print(${contenido.trim()})\n`
  }






  /**
   * Traduce un bucle while de Java a Python
   * Formato Java: while (condicion) { ... }
   * Formato Python: while condicion:
   *     ...
   */
  traducirWhile() {
    const whileToken = this.tokens[this.pos]
    this.pos++

    // Verificar paréntesis de apertura
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "(") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '(' después de 'while'",
          currentToken?.line || whileToken.line,
          currentToken?.column || whileToken.column,),)
      return
    }
    this.pos++

    // Leer la condición hasta encontrar el paréntesis de cierre
    let condicion = ""
    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ")") {
      const token = this.tokens[this.pos]

      // Traducir booleanos
      if (token.type === "TRUE") {
        condicion += "True "
      } else if (token.type === "FALSE") {
        condicion += "False "
      } else {
        condicion += token.value + " "
      }
      this.pos++
    }

    // Verificar paréntesis de cierre
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ")") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba ')' para cerrar la condición del while",
          currentToken?.line || whileToken.line,
          currentToken?.column || whileToken.column,
        ),
      )
      return
    }
    this.pos++

    // Generar código Python para el while
    this.pythonCode += `${this.indent}while ${condicion.trim()}:\n`

    // Verificar llave de apertura del bloque
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "{") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '{' para iniciar el bloque del while",
          currentToken?.line || whileToken.line,
          currentToken?.column || whileToken.column,
        ),
      )
      return
    }
    this.pos++

    // Incrementar indentación para el bloque
    this.indent += "    "

    // Procesar el contenido del bloque while
    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== "}") {
      this.traducirLineaBloque()
    }

    // Restaurar indentación
    this.indent = this.indent.slice(0, -4)

    // Verificar llave de cierre del bloque while
    if (!this.tokens[this.pos] || this.tokens[this.pos].value !== "}") {
      const currentToken = this.tokens[this.pos]
      this.errors.push(
        new ErroresSin(
          "SINTACTICO",
          currentToken?.value || "EOF",
          "Se esperaba '}' para cerrar el bloque del while",
          currentToken?.line || whileToken.line,
          currentToken?.column || whileToken.column,
        ),
      )
      return
    }
    this.pos++
  }






  /**
   * Traduce asignaciones de variables o incrementos/decrementos
   * Formato Java: variable = expresion; o variable++; o variable--;
   * Formato Python: variable = expresion o variable += 1 o variable -= 1
   */
  traducirAsignacionOIncremento() {
    const identificador = this.tokens[this.pos]
    this.pos++

    // Verificar si es un incremento (++)
    if (this.tokens[this.pos]?.type === "INCREMENTO") {
      this.pos++
      this.pythonCode += `${this.indent}${identificador.value} += 1\n`

      if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ";") {
        const currentToken = this.tokens[this.pos]
        this.errors.push(
          new ErroresSin(
            "SINTACTICO",
            currentToken?.value || "EOF",
            `Se esperaba ';' después de '${identificador.value}++'`,
            currentToken?.line || identificador.line,
            currentToken?.column || identificador.column,
          ),
        )
        return
      }
      this.pos++
      return
    }

    // Verificar si es un decremento (--)
    if (this.tokens[this.pos]?.type === "DECREMENTO") {
      this.pos++
      this.pythonCode += `${this.indent}${identificador.value} -= 1\n`

      if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ";") {
        const currentToken = this.tokens[this.pos]
        this.errors.push(
          new ErroresSin(
            "SINTACTICO",
            currentToken?.value || "EOF",
            `Se esperaba ';' después de '${identificador.value}--'`,
            currentToken?.line || identificador.line,
            currentToken?.column || identificador.column,
          ),
        )
        return
      }
      this.pos++
      return
    }

    // Verificar si es una asignación (=)
    if (this.tokens[this.pos]?.value === "=") {
      this.pos++

      // Leer la expresión hasta el punto y coma
      let expresion = ""
      while (this.pos < this.tokens.length && this.tokens[this.pos].value !== ";") {
        const token = this.tokens[this.pos]

        // Traducir valores booleanos
        if (token.type === "TRUE") {
          expresion += "True "
        } else if (token.type === "FALSE") {
          expresion += "False "
        }
        // Traducir strings y chars
        else if (token.type === "STRING") {
          expresion += this.traducirString(token.value, "STRING") + " "
        } else if (token.type === "CHAR") {
          expresion += this.traducirString(token.value, "CHAR") + " "
        }
        // Agregar cualquier otro token
        else {
          expresion += token.value + " "
        }

        this.pos++
      }

      // Generar código Python
      this.pythonCode += `${this.indent}${identificador.value} = ${expresion.trim()}\n`

      if (!this.tokens[this.pos] || this.tokens[this.pos].value !== ";") {
        const currentToken = this.tokens[this.pos]
        this.errors.push(
          new ErroresSin(
            "SINTACTICO",
            currentToken?.value || "EOF",
            `Se esperaba ';' después de la asignación '${identificador.value} = ...'`,
            currentToken?.line || identificador.line,
            currentToken?.column || identificador.column,
          ),
        )
        return
      }
      this.pos++
      return
    }

    // Si no es ninguno de los casos anteriores, es un error
    const currentToken = this.tokens[this.pos]
    this.errors.push(
      new ErroresSin(
        "SINTACTICO",
        currentToken?.value || "EOF",
        `Se esperaba '=', '++' o '--' después del identificador '${identificador.value}'`,
        currentToken?.line || identificador.line,
        currentToken?.column || identificador.column,
      ),
    )
  }




  /**
   * Traduce una línea dentro de un bloque (if, else, for, while)
   * Determina el tipo de instrucción y llama al método apropiado
   */

  traducirComentario() {
  const comentarioToken = this.tokens[this.pos]

  if (!comentarioToken) {
    return
  }

  let contenido = comentarioToken.value

  // Comentario de línea: // texto → # texto
  if (contenido.startsWith("//")) {
    contenido = contenido.substring(2).trim()
    this.pythonCode += `${this.indent}# ${contenido}\n`
  }
  // Comentario de bloque: /* texto */ → ''' texto '''
  else if (contenido.startsWith("/*") && contenido.endsWith("*/")) {
    contenido = contenido.substring(2, contenido.length - 2).trim()
    this.pythonCode += `${this.indent}''' ${contenido} '''\n`
  }

  this.pos++
}



  traducirLineaBloque() {
    const actual = this.tokens[this.pos]

    switch (actual.type) {
      case "INT_TYPE":
      case "DOUBLE_TYPE":
      case "CHAR_TYPE":
      case "STRING_TYPE":
      case "BOOLEAN_TYPE":
        this.declaracionVariable()
        break
      case "IF":
        this.traducirIf()
        break
      case "FOR":
        this.traducirFor()
        break
      case "WHILE":
        this.traducirWhile()
        break
      case "SYSTEM":
        this.traducirPrint()
        break
      case "IDENTIFICADOR":
        this.traducirAsignacionOIncremento()
        break
      default:
        // Token no reconocido, avanzar
        this.pos++
        break
    }
  }
}

// Exponer la clase Parser globalmente para uso sin módulos ES6
window.Parser = Parser
