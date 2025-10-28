class lexer {
 
  constructor(code) {
    this.posicion = 0 // Posición actual en el código
    this.columna = 1 // Columna actual (para reportes de error)
    this.linea = 1 // Línea actual (para reportes de error)
    this.token = [] // Array de tokens generados
    this.error = [] // Array de errores léxicos encontrados
    this.code = code // Código fuente a analizar
  }



  es_letra(c) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_"
  }

 

  es_digito(c) {
    return c >= "0" && c <= "9"
  }

 

  seguir_avanzando() {
    this.posicion++
    this.columna++
  }



  analizar() {
    // Reiniciar estado del analizador
    this.token = []
    this.error = []
    this.posicion = 0
    this.linea = 1
    this.columna = 1


    // Recorrer todo el código carácter por carácter
    while (this.posicion < this.code.length) {
      const c = this.code[this.posicion]



      // Ignorar espacios en blanco y tabulaciones
      if (c === " " || c === "\t") {
        this.seguir_avanzando()
        continue
      }



      // Manejar saltos de línea
      if (c === "\n") {
        this.linea++
        this.columna = 1
        this.seguir_avanzando()
        continue
      }



      // Detectar comentarios de línea (//) y tokenizarlos
if (c === "/" && this.code[this.posicion + 1] === "/") {
  const colInicio = this.columna
  let comentario = ""
  
  while (this.posicion < this.code.length && this.code[this.posicion] !== "\n") {
    comentario += this.code[this.posicion]
    this.seguir_avanzando()
  }
  
  this.token.push({
    type: "COMMENT_LINE",
    value: comentario,
    line: this.linea,
    column: colInicio
  })
  continue
}



      // Detectar comentarios de bloque (/* */) y tokenizarlos
if (c === "/" && this.code[this.posicion + 1] === "*") {
  const colInicio = this.columna
  let comentario = ""
  
  comentario += this.code[this.posicion]
  this.seguir_avanzando() // Consumir /
  comentario += this.code[this.posicion]
  this.seguir_avanzando() // Consumir *
  
  while (
    this.posicion < this.code.length &&
    !(this.code[this.posicion] === "*" && this.code[this.posicion + 1] === "/")
  ) {
    comentario += this.code[this.posicion]
    this.seguir_avanzando()
  }
  
  if (this.posicion < this.code.length) {
    comentario += this.code[this.posicion]
    this.seguir_avanzando() // Consumir *
    comentario += this.code[this.posicion]
    this.seguir_avanzando() // Consumir /
  }
  
  this.token.push({
    type: "COMMENT_BLOCK",
    value: comentario,
    line: this.linea,
    column: colInicio
  })
  continue
}


      // Reconocer strings (cadenas entre comillas dobles)
if (c === '"') {
  const colInicio = this.columna
  let valor = '"' // <-- INCLUIR comilla de apertura
  this.seguir_avanzando() // Consumir comilla de apertura

  // Leer hasta encontrar la comilla de cierre
  while (this.posicion < this.code.length && this.code[this.posicion] !== '"') {
    valor += this.code[this.posicion]
    this.seguir_avanzando()
  }

  // Verificar si se cerró correctamente
  if (this.posicion < this.code.length) {
    valor += '"' // <-- INCLUIR comilla de cierre
    this.seguir_avanzando() // Consumir comilla de cierre
    this.token.push({ type: "STRING", value: valor, line: this.linea, column: colInicio })
  } else {
    // Error: cadena sin cerrar
    this.error.push({
      tipo: "Lexico",
      descripcion: "Cadena sin cerrar",
      linea: this.linea,
      columna: colInicio,
    })
  }
  continue
}


// Reconocer caracteres (entre comillas simples)
if (c === "'") {
  const colInicio = this.columna
  let valor = "'" // <-- INCLUIR comilla de apertura
  this.seguir_avanzando() // Consumir comilla de apertura

  // Leer hasta encontrar la comilla de cierre
  while (this.posicion < this.code.length && this.code[this.posicion] !== "'") {
    valor += this.code[this.posicion]
    this.seguir_avanzando()
  }

  // Verificar si se cerró correctamente
  if (this.posicion < this.code.length) {
    valor += "'" // <-- INCLUIR comilla de cierre
    this.seguir_avanzando() // Consumir comilla de cierre
    this.token.push({ type: "CHAR", value: valor, line: this.linea, column: colInicio })
  } else {
    // Error: carácter sin cerrar
    this.error.push({
      tipo: "Lexico",
      descripcion: "Carácter sin cerrar",
      linea: this.linea,
      columna: colInicio,
    })
  }
  continue
}



      // Reconocer números (enteros y decimales)
      if (this.es_digito(c)) {
        const colInicio = this.columna
        let valor = ""
        let esDecimal = false

        // Leer todos los dígitos y puntos decimales
        while (
          this.posicion < this.code.length &&
          (this.es_digito(this.code[this.posicion]) || this.code[this.posicion] === ".")
        ) {
          if (this.code[this.posicion] === ".") {
            if (esDecimal) break // Ya tiene un punto decimal
            esDecimal = true
          }
          valor += this.code[this.posicion]
          this.seguir_avanzando()
        }

        // Determinar si es entero o decimal
        const tipo = esDecimal ? "DECIMAL" : "ENTERO"
        this.token.push({ type: tipo, value: valor, line: this.linea, column: colInicio })
        continue
      }




      // Reconocer palabras clave e identificadores
      if (this.es_letra(c)) {
        const colInicio = this.columna
        let valor = ""

        // Leer letras y dígitos (identificadores pueden contener números después de la primera letra)
        while (
          this.posicion < this.code.length &&
          (this.es_letra(this.code[this.posicion]) || this.es_digito(this.code[this.posicion]))
        ) {
          valor += this.code[this.posicion]
          this.seguir_avanzando()
        }

        
        const palabrasReservadas = {
          public: "PUBLIC",
          class: "CLASS",
          static: "STATIC",
          void: "VOID",
          main: "MAIN",
          String: "STRING_TYPE",
          args: "ARGS",
          int: "INT_TYPE",
          double: "DOUBLE_TYPE",
          char: "CHAR_TYPE",
          boolean: "BOOLEAN_TYPE",
          true: "TRUE",
          false: "FALSE",
          if: "IF",
          else: "ELSE",
          for: "FOR",
          while: "WHILE",
          System: "SYSTEM",
          out: "OUT",
          println: "PRINTLN",
        }

        const tipo = palabrasReservadas[valor]

        // Determinar si es palabra reservada o identificador
        const tipoFinal = tipo || "IDENTIFICADOR"
        this.token.push({ type: tipoFinal, value: valor, line: this.linea, column: colInicio })
        continue
      }

      // Reconocer operadores de dos caracteres (==, !=, <=, >=, ++, --, +=, -=)
      if (this.posicion < this.code.length - 1) {
        const doble = c + this.code[this.posicion + 1]
        const operadoresDobles = {
          "==": "IGUAL_IGUAL",
          "!=": "DIFERENTE",
          "<=": "MENOR_IGUAL",
          ">=": "MAYOR_IGUAL",
          "++": "INCREMENTO",
          "--": "DECREMENTO",
          "+=": "MAS_IGUAL",
          "-=": "MENOS_IGUAL",
        }

        if (operadoresDobles[doble]) {
          const colInicio = this.columna
          this.token.push({ type: operadoresDobles[doble], value: doble, line: this.linea, column: colInicio })
          this.seguir_avanzando()
          this.seguir_avanzando()
          continue
        }
      }

      // Reconocer símbolos de un solo carácter
      const simbolos = {
        "{": "LLAVE_ABIERTA",
        "}": "LLAVE_CERRADA",
        "(": "PARENTESIS_ABIERTO",
        ")": "PARENTESIS_CERRADO",
        "[": "CORCHETE_ABIERTO",
        "]": "CORCHETE_CERRADO",
        ";": "PUNTO_Y_COMA",
        ",": "COMA",
        ".": "PUNTO",
        "=": "ASIGNACION",
        "+": "SUMA",
        "-": "RESTA",
        "*": "MULTIPLICACION",
        "/": "DIVISION",
        "<": "MENOR_QUE",
        ">": "MAYOR_QUE",
      }

      if (simbolos[c]) {
        const colInicio = this.columna
        this.token.push({ type: simbolos[c], value: c, line: this.linea, column: colInicio })
        this.seguir_avanzando()
        continue
      }

      // Si llegamos aquí, el carácter no es reconocido (error léxico)
      this.error.push({
        tipo: "Lexico",
        descripcion: `Carácter no reconocido: '${c}'`,
        linea: this.linea,
        columna: this.columna,
      })
      this.seguir_avanzando()
    } 




    return this.token
  }





} //fin de la clase lexer

// Exponer la clase globalmente para uso sin módulos ES6
window.lexer = lexer
