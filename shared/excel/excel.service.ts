import { Injectable } from "@angular/core";
import FileSaver from "file-saver";
import moment from "moment";
// Dynamic imports used to save bundle size
import { PageOrientation, PageSize } from "pdfmake/interfaces";

// const EXCEL_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
const EXCEL_EXTENSION = ".xlsx";
const CSV_TYPE = "text/csv;charset=utf-8;";
const CSV_EXTENSION = ".csv";

@Injectable({
  providedIn: "root",
})
export class ExcelService {
  constructor() { }

  async ExportTOExcel(data: any, filename: any, projectName?: any, isEqual?: any, date?: any) {
    const XLSX = await import("xlsx-js-style");
    const ws: any = XLSX.utils.json_to_sheet(data);
    for (var i in ws) {
      if (typeof ws[i] != "object") continue;
      let cell = XLSX.utils.decode_cell(i);
      ws[i].s = {
        with: 100,
        // styling for all cells
        font: {
          // name: 'arial',
        },
        alignment: {
          // vertical: 'center',
          // horizontal: 'center',
          // wrapText: '1', // any truthy value here
        },
        border: {
          // right: {
          //   style: 'thin',
          //   color: '000000',
          // },
          // left: {
          //   style: 'thin',
          //   color: '000000',
          // },
        },
      };

      // if (cell.c == 6) {
      //   ws[i].s.numFmt = 'DD-MM-YYYY';
      //   ws[i].z = 'DD-MM-YYYY';
      // } else {
      //   ws[i].s.numFmt = '00';
      // }

      if (cell.r == 0) {
        // first row
        // backgroud color
        // ws[i].s.fill = {
        //   patternType: 'solid',
        //   fgColor: { rgb: 'b2b2b2' },
        //   bgColor: { rgb: 'b2b2b2' },
        // }
        ws[i].s.font = { bold: true };
        // ws[i].s.border.bottom = {
        //   // bottom border
        //   bold:true,
        //   // style: 'thin',
        //   // color: '000000',
        // };
      }

      // if (cell.r % 2) {
      //   // every other row
      //   ws[i].s.fill = {
      //     // background color
      //     // patternType: 'white',
      //     // fgColor: { rgb: 'b2b2b2' },
      //     // bgColor: { rgb: '000000' },
      //   };
      // }
    }
    const wb: any = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "data");
    // XLSX.writeFile(wb, filename + "_" + moment().format("MMDDYYYY") + EXCEL_EXTENSION);
    XLSX.writeFile(
      wb,
      filename +
      "_" +
      (projectName !== "fax"
        ? moment().format("MMDDYYYY")
        : !isEqual
          ? moment(date?.fromdate).format("MMDDYYYY") + "_" + moment(date?.todate).format("MMDDYYYY")
          : moment(date?.fromdate).format("MMDDYYYY")) +
      EXCEL_EXTENSION
    );
  }

  async ExportTOExcelWithImage(data: any[], filename: string) {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${filename}_${moment().format("MMDDYYYY")}`);

    let startRow = 1;

    let headerImageRow: any | null = null;
    if (data.length && data[0]?.isHeaderImage) {
      headerImageRow = data.shift();
    }

    if (headerImageRow) {
      const base64Img = Object.values(headerImageRow).find(
        (val: any) => typeof val === "string" && val.includes("base64")
      ) as string | undefined;

      if (base64Img) {
        const imageId = workbook.addImage({
          base64: base64Img,
          extension: "png",
        });

        worksheet.addImage(imageId, {
          tl: { col: 0, row: 0 },
          ext: { width: 1800, height: 270 },
        });

        startRow = 15;
      }
    }

    const headers = Object.keys(data[0] || {});
    const headerRow = worksheet.getRow(startRow);
    headers.forEach((header, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = header;

      cell.font = { bold: true };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF73847B" },
      };

      cell.font = {
        color: { argb: "FFFFFFFF" },
        bold: true,
      };
    });
    headerRow.height = 25;

    data.forEach((row, rowIndex) => {
      const excelRow = worksheet.getRow(startRow + 1 + rowIndex);
      headers.forEach((key, colIndex) => {
        const value = row[key];
        const cell = excelRow.getCell(colIndex + 1);

        if (typeof value === "string" && value.includes("base64")) {
          const imageId = workbook.addImage({
            base64: value,
            extension: "png",
          });

          worksheet.addImage(imageId, {
            tl: { col: colIndex, row: startRow + rowIndex },
            ext: { width: 100, height: 80 },
          });
          cell.value = "";
        } else {
          cell.value = value;
        }

        cell.alignment = { vertical: "top", horizontal: "left", wrapText: true };

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    worksheet.columns.forEach((col: any) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const len = cell.value ? cell.value.toString().length : 10;
        if (len > maxLength) maxLength = len;
      });
      col.width = maxLength + 2;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    FileSaver.saveAs(
      new Blob([buffer], { type: "application/octet-stream" }),
      `${filename}_${moment().format("MMDDYYYY")}${EXCEL_EXTENSION}`
    );
  }

  async exportToPdf(data: any, filename: any, projectName?: any, isEqual?: any, date?: any) {
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    (pdfMake as any).vfs = (pdfFonts as any).vfs;
    const imageRowIndex = data.findIndex((row: any) => row?.isImageRow === true);
    let imageSection: any[] = [];
    const headers = Object.keys(data[0] || {}).filter((h) => h !== "isImageRow");
    let pageSize: PageSize = "A4";
    const totalRows = 1 + headers.length;
    let pageOrientation: PageOrientation | undefined = undefined;
    // Set page size & orientation based on totalRows
    if (totalRows <= 6) {
      pageSize = "A4";
      pageOrientation = "portrait";
    } else if (totalRows <= 8) {
      pageSize = "A3";
      pageOrientation = "landscape";
    } else if (totalRows <= 10 || totalRows == 11) {
      pageSize = "A2";
      pageOrientation = "landscape";
    } else if (totalRows <= 12 || totalRows < 13 || totalRows < 14) {
      pageSize = "A1";
      pageOrientation = "landscape";
    } else if (totalRows <= 15) {
      pageSize = "A0";
      pageOrientation = "landscape";
    } else if (totalRows <= 20) {
      pageSize = "2A0";
      pageOrientation = "landscape";
    } else if (totalRows <= 22) {
      pageSize = "4A0";
      pageOrientation = "landscape";
    } else {
      pageSize = "4A0";
      pageOrientation = "landscape";
    }
    if (filename == "Policy_Report") {
      pageSize = "A2";
    }
    // Handle image row (scale based on pageSize directly)
    if (imageRowIndex !== -1) {
      const imageRow = data[imageRowIndex];
      const imageBase64 = Object.values(imageRow).find((val: any) => typeof val === "string" && val.includes("base64"));
      if (imageBase64) {
        const imageWidths: Record<string, number> = {
          A4: 500,
          A3: 1400,
          A2: 1600,
          A1: 1800,
          A0: 2150,
          "2A0": 2800,
          "4A0": 4000,
          LETTER: 600,
          LEGAL: 650,
          TABLOID: 700,
          EXECUTIVE: 500,
          FOLIO: 600,
        };
        imageSection.push({
          image: imageBase64,
          width: imageWidths[pageSize] || 500, // fallback to 500
          margin: [0, 0, 0, 20],
          alignment: "center",
        });
      }
      data.splice(imageRowIndex, 1);
    }
    // filter data and table
    const filteredData = data.map((row: any) => {
      const filteredRow: any = {};
      headers.forEach((header) => (filteredRow[header] = row[header]));
      return filteredRow;
    });
    const rows = filteredData.map((row: any) => headers.map((header) => row[header]));
    const columnWidths = headers.map((header) => {
      let maxLength = Math.max(...data.map((row: any) => row[header]?.length || 0));
      return maxLength > 20 ? "auto" : "*";
    });
    const documentDefinition = {
      pageOrientation,
      pageSize,
      content: [
        {
          alignment: "center",
          stack: [
            ...imageSection,
            {
              text: capitalizeFirstLetter(filename),
              fontSize: 22,
              bold: true,
              margin: [0, 0, 0, 20], // Margin to separate from the table
            },
            // Table
            {
              table: {
                headerRows: 1,
                widths: columnWidths,
                body: [
                  headers.map((header) => ({
                    text: header,
                    bold: true,
                    fontSize: 14,
                    alignment: "center",
                    fillColor: "#73847b",
                    color: "#ffffff",
                  })),
                  ...rows.map((row: any) =>
                    row.map((data: any) =>
                      typeof data === "string" && data.includes("base64")
                        ? { image: data, width: 50, alignment: "center" }
                        : { text: data ?? "", fontSize: 12, alignment: "center" }
                    )
                  ),
                ],
              },
            },
          ],
        },
      ] as any,
    };

    if (projectName != "fax") filename = filename + "_" + moment().format("MMDDYYYY") + ".pdf";
    else {
      if (!isEqual)
        filename =
          filename +
          "_" +
          moment(date.fromdate).format("MMDDYYYY") +
          "_" +
          moment(date.todate).format("MMDDYYYY") +
          ".pdf";
      else filename = filename + "_" + moment(date.todate).format("MMDDYYYY") + ".pdf";
    }
    pdfMake.createPdf(documentDefinition).download(filename);
  }

  // Export to CSV
  exportToCsv(data: any[], filename: string): void {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: CSV_TYPE });
    FileSaver.saveAs(blob, `${filename}_${moment().format("MMDDYYYY")}${CSV_EXTENSION}`);
  }

  // Convert JSON to CSV format
  private convertToCSV(data: any[]): string {
    if (!data.length) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(",")];

    for (const row of data) {
      const values = headers.map((header) => {
        let value = row[header];
        // ensure raw text for date-like strings
        if (typeof value === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          value = `\t${value}`;
        }
        return typeof value === "string" && value.includes(",") ? `"${value.replace(/"/g, '""')}"` : value;
      });
      csvRows.push(values.join(","));
    }

    return csvRows.join("\n");
  }

  printTable(data: any[], title: string): void {
    const tableHtml = this.generateTable(data);
    const printWindow = window.open(title, "_blank", "width=800,height=600");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              zoom: 80%; 
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed; 
            }
            th, td {
              padding: 8px;
              border: 1px solid black;
              text-align: left;
              overflow: hidden; 
              text-overflow: ellipsis; 
              word-wrap: break-word;
            }
            th {
              background-color: #f2f2f2;
            }
            .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 20px;
            color: #888888;
            padding: 10px 0;
            background-color: #f2f2f2;
          }
          }
        </style>
      </head>
      <body>
        ${tableHtml}
         <footer class="footer"><b>adamsbridge</b></footer>
      </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.print();
    }
  }

  private generateTable(data: any[]): string {
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";

    const headers = Object.keys(data[0]);
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headers.forEach((header) => {
      const th = document.createElement("th");
      th.textContent = header.toUpperCase();
      th.style.backgroundColor = "#f2f2f2";
      th.style.padding = "8px";
      th.style.border = "1px solid black";
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach((row) => {
      const tr = document.createElement("tr");
      headers.forEach((header) => {
        const td = document.createElement("td");
        td.textContent = row[header];
        td.style.padding = "8px";
        td.style.border = "1px solid black";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    return table.outerHTML;
  }

  // exportToExcelDashboardView(data: any, filename: string) {
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   let hasSheets = false;
  //   for (let i = 0; i < data.length; i += 2) {
  //     const sheetTitle = data[i];
  //     const rawData = data[i + 1];
  //     console.log(`Processing Sheet: ${sheetTitle}`, rawData);
  //     if (!Array.isArray(rawData) || rawData.length === 0) {
  //       console.warn(`Skipping sheet "${sheetTitle}" - No data found.`);
  //       continue;
  //     }
  //     let worksheetData: any[] = [];
  //     try {
  //       const headers = rawData[0] ? Object.keys(rawData[0]) : [];
  //       console.log(`Extracted Headers for "${sheetTitle}":`, headers);
  //       if (headers.length === 0) {
  //         console.warn(`Skipping sheet "${sheetTitle}" - No valid headers.`);
  //         continue;
  //       }
  //       worksheetData.push(headers);
  //       rawData.forEach((item: any, index: number) => {
  //         console.log(`Processing row ${index + 1} for sheet "${sheetTitle}":`, item);
  //         worksheetData.push(headers.map((header) => stripHtml(item[header] || "")));
  //       });
  //       const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
  //       ws["!cols"] = headers.map(() => ({ wch: 20 }));
  //       XLSX.utils.book_append_sheet(wb, ws, sheetTitle.substring(0, 31));
  //       hasSheets = true;
  //     } catch (error) {
  //       console.error(`Error processing sheet "${sheetTitle}":`, error);
  //     }
  //   }

  //   if (!hasSheets) {
  //     console.error("No valid sheets found. File will not be generated.");
  //     return;
  //   }

  //   try {
  //     XLSX.writeFileXLSX(wb, `${filename ? filename : "untitled"}_${moment().format("MMDDYYYY")}.xlsx`);
  //     console.log("Download triggered!");
  //   } catch (error) {
  //     console.error("Error writing Excel file:", error);
  //   }
  // }

  async exportToExcelDashboardView(data: any, filename: string) {
    const XLSX = await import("xlsx-js-style");
    const wb: any = XLSX.utils.book_new();
    let hasSheets = false;

    for (let i = 0; i < data.length; i += 2) {
      const sheetTitle = data[i];
      const rawData = data[i + 1];

      if (!sheetTitle || !Array.isArray(rawData) || rawData.length === 0) {
        // console.warn(`Skipping sheet "${sheetTitle}" - No data found.`);
        continue;
      }

      const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
      if (headers.length === 0) {
        // console.warn(`Skipping sheet "${sheetTitle}" - No valid headers.`);
        continue;
      }

      let worksheetData: any[] = [];
      worksheetData.push(headers);
      rawData.forEach((item) => {
        worksheetData.push(headers.map((header) => stripHtml(item[header] || "")));
      });

      const sanitizedTitle = sheetTitle
        .replace(/[\\\?\*\[\]:]/g, "")
        .replace(/\//g, " ")
        .substring(0, 31);

      const ws: any = XLSX.utils.aoa_to_sheet(worksheetData);
      ws["!cols"] = headers.map(() => ({ wch: 20 }));
      XLSX.utils.book_append_sheet(wb, ws, sanitizedTitle);

      hasSheets = true;
    }

    if (!hasSheets) {
      return;
    }

    try {
      XLSX.writeFile(wb, `${filename}.xlsx`);
      // console.log("Download triggered!");
    } catch (error) {
      console.error(error);
    }
  }

  // exportToPdfDashboardView(data: any, filename: any) {
  //   console.log("data --->", data);

  //   let content: any[] = [];
  //   let processedTitles: Set<string> = new Set();

  //   for (let i = 0; i < data.length; i += 2) {
  //     const sheetTitle = data[i];
  //     const rawData = data[i + 1];
  //     if (!Array.isArray(rawData) || rawData.length === 0) {
  //       console.warn(`Skipping sheet "${sheetTitle}" - No data found.`);
  //       continue;
  //     }
  //     if (processedTitles.has(sheetTitle)) {
  //       console.warn(`Skipping duplicate report: "${sheetTitle}"`);
  //       continue;
  //     }

  //     processedTitles.add(sheetTitle);
  //     if (content.length > 0) {
  //       content.push({ text: "", pageBreak: "before" });
  //     }
  //     content.push({
  //       text: sheetTitle,
  //       fontSize: 18,
  //       bold: true,
  //       alignment: "center",
  //       margin: [0, 0, 0, 10],
  //       decoration: "underline",
  //     });

  //     const headers = Object.keys(rawData[0]);
  //     const columnWidths = headers.map((header) =>
  //       header.toLowerCase().includes("comment") || header.toLowerCase().includes("description") ? "*" : "auto"
  //     );

  //     const rows = rawData.map((item: any) =>
  //       headers.map((header: any) => {
  //         let textData = item[header] != null ? stripHtml(item[header].toString()) : "";

  //         if (textData.length > 150) {
  //           textData = textData.replace(/(.{150})/g, "$1\n");
  //         }

  //         return {
  //           text: textData,
  //           fontSize: 10,
  //           alignment: "left",
  //           margin: [3, 3, 3, 3],
  //           border: [true, true, true, true],
  //           wordWrap: true,
  //         };
  //       })
  //     );

  //     content.push({
  //       table: {
  //         headerRows: 1,
  //         // widths: columnWidths,
  //         body: [
  //           headers.map((header) => ({
  //             text: header,
  //             bold: true,
  //             fontSize: 12,
  //             alignment: "center",
  //             fillColor: "#73847b",
  //             color: "#ffffff",
  //             margin: [5, 5, 5, 5],
  //             border: [true, true, true, true],
  //           })),
  //           ...rows,
  //         ],
  //       },
  //       layout: {
  //         hLineWidth: () => 1,
  //         vLineWidth: () => 1,
  //         hLineColor: () => "#000000",
  //         vLineColor: () => "#000000",
  //       },
  //       margin: [0, 10, 0, 20],
  //     });
  //   }

  //   if (content.length === 0) {
  //     console.error("No valid sheets found. PDF will not be generated.");
  //     return;
  //   }

  //   const documentDefinition: any = {
  //     pageSize: "A0",
  //     pageOrientation: "landscape",
  //     content: [
  //       {
  //         alignment: "center",
  //         stack: [
  //           {
  //             text: capitalizeFirstLetter(filename ? filename : "untitled"),
  //             fontSize: 22,
  //             bold: true,
  //             margin: [0, 0, 0, 20],
  //           },
  //           ...content,
  //         ],
  //       },
  //     ],
  //   };
  //   filename = (filename ? filename : "untitled") + ".pdf";
  //   pdfMake.createPdf(documentDefinition).download(filename);
  // }

  async exportToPdfDashboardView(data: any, filename: any) {
    const pdfMakeModule = await import("pdfmake/build/pdfmake");
    const pdfFontsModule = await import("pdfmake/build/vfs_fonts");
    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;
    (pdfMake as any).vfs = (pdfFonts as any).vfs;
    let content: any[] = [];
    let processedTitles: Set<string> = new Set();
    let maxHeadersLength = 0;
    let maxRowsLength = 0;

    function stripHtml(html: string): string {
      return html.replace(/<[^>]*>?/gm, "");
    }

    function capitalizeFirstLetter(str: string): string {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function determinePageSize(headersLength: number, rowCount: number): { pageSize: string; pageOrientation: string } {
      if (headersLength > 10 || rowCount > 50) {
        return { pageSize: "A0", pageOrientation: "landscape" };
      } else if (headersLength > 6 || rowCount > 30) {
        return { pageSize: "A1", pageOrientation: "landscape" };
      } else if (headersLength > 4 || rowCount > 20) {
        return { pageSize: "A2", pageOrientation: "landscape" };
      } else {
        return { pageSize: "A3", pageOrientation: "landscape" };
      }
    }

    for (let i = 0; i < data.length; i += 2) {
      const sheetTitle = data[i];
      const rawData = data[i + 1];

      if (!Array.isArray(rawData) || rawData.length === 0) {
        continue;
      }

      if (processedTitles.has(sheetTitle)) {
        continue;
      }

      processedTitles.add(sheetTitle);

      if (content.length > 0) {
        content.push({ text: "", pageBreak: "before" });
      }

      content.push({
        text: sheetTitle,
        fontSize: 18,
        bold: true,
        alignment: "center",
        margin: [0, 0, 0, 10],
        decoration: "underline",
      });

      const headers = Object.keys(rawData[0]);
      maxHeadersLength = Math.max(maxHeadersLength, headers.length);
      maxRowsLength = Math.max(maxRowsLength, rawData.length);

      const tableWidthPercent = 100;
      const columnWidths = headers.map(() => `${tableWidthPercent / headers.length}%`);

      const rows = rawData.map((item: any) =>
        headers.map((header: any) => {
          let textData = item[header] != null ? stripHtml(item[header].toString()) : "";

          if (textData.length > 150) {
            textData = textData.replace(/(.{150})/g, "$1\n");
          }

          return {
            text: textData,
            fontSize: 10,
            alignment: "left",
            margin: [3, 3, 3, 3],
            border: [true, true, true, true],
            wordWrap: true,
          };
        })
      );
      content.push({
        table: {
          headerRows: 1,
          widths: columnWidths, // Uncomment if you want dynamic width adjustment
          body: [
            headers.map((header) => ({
              text: header,
              bold: true,
              fontSize: 12,
              alignment: "center",
              fillColor: "#73847b",
              color: "#ffffff",
              margin: [5, 5, 5, 5],
              border: [true, true, true, true],
            })),
            ...rows,
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => "#000000",
          vLineColor: () => "#000000",
        },
        margin: [0, 10, 0, 20],
      });
    }

    if (content.length === 0) {
      return;
    }

    const { pageSize, pageOrientation } = determinePageSize(maxHeadersLength, maxRowsLength);
    // console.log(`Using dynamic pageSize: ${pageSize}, Orientation: ${pageOrientation}`);

    const documentDefinition: any = {
      pageSize,
      pageOrientation,
      content: [
        {
          alignment: "center",
          stack: [
            {
              text: capitalizeFirstLetter(filename ? filename : "untitled"),
              fontSize: 22,
              bold: true,
              margin: [0, 0, 0, 20],
            },
            ...content,
          ],
        },
      ],
    };

    filename = (filename ? filename : "untitled") + ".pdf";
    pdfMake.createPdf(documentDefinition).download(filename);
  }

  async convertBlobToJsonArray(blob: Blob): Promise<any[]> {
    const XLSX = await import("xlsx-js-style");
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: any) => {
        try {
          // Convert the ArrayBuffer to a binary string
          const arrayBuffer = event.target.result;
          const binaryString = new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '');

          // Parse the binary string into a workbook object
          const workbook = XLSX.read(binaryString, { type: 'binary' });

          // Get the first sheet's name
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) {
            throw new Error("No sheets found in the Excel file");
          }

          // Get the worksheet using the sheet name
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            throw new Error("Worksheet not found in the Excel file");
          }

          // Convert the worksheet to JSON
          const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

          // Resolve the promise with the data
          resolve(data);
        } catch (error) {
          // Reject the promise if there is an error
          reject(error);
        }
      };

      reader.onerror = (error) => {
        // Reject the promise if there is an error reading the file
        reject(error);
      };

      // Read the file as ArrayBuffer
      reader.readAsArrayBuffer(blob);
    });
  }
}

function capitalizeFirstLetter(str: any) {
  return str.replace(/\b\w/g, function (char: any) {
    return char.toUpperCase();
  });
}

function stripHtml(html: string): string {
  let doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}
