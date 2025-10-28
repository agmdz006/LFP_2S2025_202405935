class Token{
    constructor(tipo, valor, linea, columna){
        this.tipo = tipo;
        this.valor = valor;
        this.linea = linea;
        this.columna = columna;
    }
}


export { Token }