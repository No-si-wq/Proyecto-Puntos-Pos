const UNIDADES = [
  "", "UN", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
];
const ESPECIALES = [
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE",
  "DIECISÉIS", "DIECISIETE", "DIECIOCHO", "DIECINUEVE",
];
const DECENAS = [
  "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA",
  "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
];
const CENTENAS = [
  "", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
];

function tresDigitos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";

  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = CENTENAS[c];

  if (resto > 0) {
    texto += texto ? " " : "";
    texto += dosDigitos(resto);
  }

  return texto;
}

function dosDigitos(n: number): string {
  if (n < 10) return UNIDADES[n];
  if (n < 20) return ESPECIALES[n - 10];

  const d = Math.floor(n / 10);
  const u = n % 10;

  if (u === 0) return DECENAS[d];
  if (d === 2) return u === 1 ? "VEINTIÚN" : `VEINTI${UNIDADES[u]}`;

  return `${DECENAS[d]} Y ${UNIDADES[u]}`;
}

function seccion(n: number, divisor: number, singular: string, plural: string): string {
  const cantidad = Math.floor(n / divisor);
  const resto = n % divisor;

  let texto = "";
  if (cantidad > 0) {
    texto = cantidad === 1 ? singular : `${tresDigitos(cantidad)} ${plural}`;
  }

  if (resto > 0) {
    texto += texto ? " " : "";
    texto += enteroALetras(resto);
  }

  return texto;
}

function enteroALetras(n: number): string {
  if (n === 0) return "CERO";
  if (n < 1000) return tresDigitos(n);
  if (n < 1_000_000) return seccion(n, 1000, "MIL", "MIL");
  if (n < 1_000_000_000) {
    return seccion(n, 1_000_000, "UN MILLÓN", "MILLONES");
  }
  return seccion(n, 1_000_000_000, "UN MIL MILLONES", "MIL MILLONES");
}

/**
 * Convierte un monto numérico a su representación en letras,
 * con formato de moneda en español (ej. para facturación en Honduras).
 *
 * @example numberToWords(1250.5) // "MIL DOSCIENTOS CINCUENTA LEMPIRAS CON 50/100"
 */
export function numberToWords(amount: number, currency: string = "LEMPIRAS"): string {
  const valorAbsoluto = Math.abs(amount);
  const parteEntera = Math.floor(valorAbsoluto);
  const centavos = Math.round((valorAbsoluto - parteEntera) * 100);

  let enteroTexto = parteEntera === 0 ? "CERO" : enteroALetras(parteEntera);
  let monedaTexto = currency;

  // Concordancia singular: "UN LEMPIRA" en vez de "UN LEMPIRAS"
  if (parteEntera === 1) {
    enteroTexto = "UN";
    monedaTexto = currency.endsWith("S") ? currency.slice(0, -1) : currency;
  }

  const centavosTexto = String(centavos).padStart(2, "0");
  const signo = amount < 0 ? "MENOS " : "";

  return `${signo}${enteroTexto} ${monedaTexto} CON ${centavosTexto}/100`;
}