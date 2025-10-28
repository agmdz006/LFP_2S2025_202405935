class ErroresSin {
    constructor(type, valor, mensaje, linea, columna) {
        this.type = type;
        this.valor = valor; 
        this.mensaje = mensaje;
        this.linea = linea;
        this.columna = columna;
    }
}

export { ErroresSin }