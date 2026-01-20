const { GoogleSpreadsheet } = require("google-spreadsheet");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { docente, laboratorio, curso, dia, jornada } =
      JSON.parse(event.body);

    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!rawPrivateKey) {
      throw new Error("GOOGLE_PRIVATE_KEY no está definida en Netlify");
    }

    const doc = new GoogleSpreadsheet(
      process.env.SHEET_ID,
      {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: rawPrivateKey.replace(/\\n/g, "\n"),
      }
    );

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();

    const existe = rows.some(r =>
      r.laboratorio === laboratorio &&
      r.dia === dia &&
      r.jornada === jornada
    );

    if (existe) {
      return { statusCode: 409, body: "BLOQUEADO" };
    }

    await sheet.addRow({
      timestamp: new Date().toISOString(),
      docente,
      laboratorio,
      curso,
      dia,
      jornada,
    });

    return { statusCode: 200, body: "OK" };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
};
