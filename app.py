from flask import Flask, request, send_file, render_template
from fpdf import FPDF
import tempfile
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)


app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///purchase.db"
app.config['SQLALCHEMY_TRACK_MODIFICATION'] = False


db = SQLAlchemy(app)
db.init_app

@app.before_request
def create_table():
    db.create_all()

class User(db.Model):
    sno = db.Column(db.Integer,primary_key=True)
    docno = db.Column(db.Integer)
    customer = db.Column(db.String)
    # docdate = db.Column(db.String)
    product_name = db.Column(db.String)
    quantity = db.Column(db.Integer)
    price = db.Column(db.Integer)
    total = db.Column(db.Integer)

class PDF(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Invoice', 0, 1, 'C')

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def invoice_body(self, docno, docdate, customer_name, items, total_amount):
        self.set_font('Arial', '', 12)
        self.cell(0, 10, f'Document No: {docno}', 0, 1)
        self.cell(0, 10, f'Document date: {docdate}', 0, 1)
        self.cell(0, 10, f'Customer Name: {customer_name}', 0, 1)
        self.ln(10)
        self.set_font('Arial', 'B', 12)
        self.cell(10, 10, '#', 1)
        self.cell(80, 10, 'Product Name', 1)
        self.cell(30, 10, 'Quantity', 1)
        self.cell(30, 10, 'Price', 1)
        self.cell(30, 10, 'Total', 1)
        self.ln(10)
        self.set_font('Arial', '', 12)
        for idx, item in enumerate(items):
            self.cell(10, 10, str(idx + 1), 1)
            self.cell(80, 10, item['description'], 1)
            self.cell(30, 10, item['quantity'], 1)
            self.cell(30, 10, item['price'], 1)
            self.cell(30, 10, item['total'], 1)
            self.ln(10)
        self.set_font('Arial', '', 12)
        self.cell(0, 50, f'Total Amount : {total_amount}', 0, 1)

@app.route('/')
def home():
    return render_template('home.html')

@app.route('/generate_invoice', methods=['POST'])
def generate_invoice():
    if request.method == 'POST':
        data = request.get_json()
        docno = data['docno']
        docdate = data['docdate']
        customer_name = data['customerName']
        total_amount = data['total_amount']
        items = data['items']

        # print(data)

        for entry in items:
            db.session.add(User(
                docno = entry['docno'],
                # docdate = entry['docdate'],
                customer = entry['customerName'],
                product_name = entry['description'],
                quantity = entry['quantity'],
                price = entry['price'],
                total = entry['total']))
            db.session.commit()
            

        pdf = PDF()
        pdf.add_page()
        pdf.invoice_body(docno, docdate, customer_name, items, total_amount)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            pdf.output(temp_file.name)
            return send_file(temp_file.name, as_attachment=True, download_name='invoice.pdf')

if __name__ == '__main__':
    app.run(debug=True)
