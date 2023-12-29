const dataView = async ({ arg, data, context }) => {
    const table = document.createElement('table')
    if (!data?.[0]?.length) {
        return table
    }
    if (arg.exec) {
        let HyperFormula = await context.loadLib('HyperFormula')
        data = HyperFormula.buildFromArray(data, {
            licenseKey: 'gpl-v3'
        }).getAllSheetsValues()['Sheet1']
    }
    const createRow = (rowData, t) => {
        let row = document.createElement('tr')
        for (let j = 0; j < rowData.length; j++) {
            let cell = document.createElement(t)
            cell.innerText = rowData[j]
            row.appendChild(cell)
        }
        return row
    }
    let headData = data.shift()
    if (headData) {
        let thead = document.createElement('thead')
        table.appendChild(thead)
        thead.appendChild(createRow(headData, 'th'))
    }
    let tbody = document.createElement('tbody')
    table.appendChild(tbody)
    for (const dataRow of data) {
        tbody.appendChild(createRow(dataRow, 'td'))
    }
    return table
}

export default { dataView, defaults: { dtype: 'csv' } }