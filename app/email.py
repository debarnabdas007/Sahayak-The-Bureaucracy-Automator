import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from flask import current_app

def send_email(to, subject, body, attachment_data=None, attachment_filename=None):
    msg = MIMEMultipart()
    # Use the sender from the app's config, but allow override for testing
    sender = current_app.config['MAIL_USERNAME']
    msg['From'] = sender
    msg['To'] = to
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    if attachment_data and attachment_filename:
        part = MIMEApplication(
            attachment_data,
            Name=attachment_filename
        )
        part['Content-Disposition'] = f'attachment; filename="{attachment_filename}"'
        msg.attach(part)

    try:
        server = smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT'])
        server.starttls()
        server.login(current_app.config['MAIL_USERNAME'], current_app.config['MAIL_PASSWORD'])
        text = msg.as_string()
        server.sendmail(sender, to, text)
        server.quit()
        return True
    except Exception as e:
        print(e)
        return False
