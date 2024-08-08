let itemCount = 0;

function addItem() {
    itemCount++;
    const docno = document.getElementById("docno").value;
    const docdate = document.getElementById("docdate").value;
    const customerName = document.getElementById("customerName").value;
    const table = document.getElementById("invoiceTable").getElementsByTagName('tbody')[0];
    const newRow = table.insertRow();
    newRow.innerHTML = `
        <tr>
            <th scope="row">${itemCount}</th>
            <td><input type="number" class="" id="docno" value=${docno}></td>
            <td><input type="datetime" class="" id="docdate" value=${docdate}></td>
            <td><input type="text" class="" id="customerName" value=${customerName}></td>
            <td><input type="text" class="" placeholder="Product Name"></td>
            <td><input type="number" class="" placeholder="Quantity" oninput="calculateTotal(this)"></td>
            <td><input type="number" class="" placeholder="Price" oninput="calculateTotal(this)"></td>
            <td class="item-total" id="item-total"><input type="number" name="total" value="0"/> </td>
            <td><button class="btn btn-danger" onclick="removeItem(this)">Remove</button></td>
        </tr>
    `;
};

function calculateTotal(element) {
    const row = element.parentElement.parentElement;
    const quantity = row.cells[5].getElementsByTagName('input')[0].value;
    const price = row.cells[6].getElementsByTagName('input')[0].value;
    const total = row.cells[7];
    total.getElementsByTagName('input')[0].value = (quantity * price).toFixed(2);

    const itemTable = document.getElementById('item_tbody');
    let amount = 0;
    const rows = itemTable.querySelectorAll('tr');

    rows.forEach(row => {
        const cell = row.cells[7];
        if (cell) {
            const cellValue = parseFloat(cell.getElementsByTagName('input')[0].value);
            if (!isNaN(cellValue)) {
                amount += cellValue;
            }
        }
    });

    document.getElementById('total_cal').value = amount.toFixed(2);
};

function removeItem(button) {
    const row = button.parentElement.parentElement;
    row.parentElement.removeChild(row);
    itemCount--;
    updateRowNumbers();
}

function updateRowNumbers() {
    const table = document.getElementById("invoiceTable").getElementsByTagName('tbody')[0];
    for (let i = 0; i < table.rows.length; i++) {
        table.rows[i].cells[0].innerText = i + 1;
    }
}

function generateInvoice() {
    const docno = document.getElementById("docno").value;
    const docdate = document.getElementById("docdate").value;
    const customerName = document.getElementById("customerName").value;
    const total_amount = document.getElementById('total_cal').value;
    const table = document.getElementById("invoiceTable").getElementsByTagName('tbody')[0];
    const items = [];
    for (let i = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        const docno = row.cells[1].getElementsByTagName('input')[0].value;
        const docdate = row.cells[2].getElementsByTagName('input')[0].value;
        const customerName = row.cells[3].getElementsByTagName('input')[0].value;
        const description = row.cells[4].getElementsByTagName('input')[0].value;
        const quantity = row.cells[5].getElementsByTagName('input')[0].value;
        const price = row.cells[6].getElementsByTagName('input')[0].value;
        const total = row.cells[7].innerText;
        items.push({docno, docdate, customerName, description, quantity, price, total,total_amount });
    }

    // Send data to Python for processing
    fetch('/generate_invoice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': 'csrftoken'
        },
        body: JSON.stringify({ docno, docdate, customerName, items, total_amount }),
        
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'invoice.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(error => console.error('Error:', error));
}
