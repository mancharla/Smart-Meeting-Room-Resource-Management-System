from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
)


def create_booking_pdf(bookings):
    output = BytesIO()

    document = SimpleDocTemplate(
        output,
        pagesize=landscape(A4),
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()

    elements = []

    title = Paragraph(
        "Smart Meeting Room - Booking Report",
        styles["Title"],
    )

    elements.append(title)

    elements.append(Paragraph("<br/>", styles["Normal"]))

    data = [
        [
            "Booking ID",
            "User ID",
            "Room ID",
            "Title",
            "Start Time",
            "End Time",
            "Status",
        ]
    ]

    for booking in bookings:
        data.append(
            [
                booking.id,
                booking.user_id,
                booking.room_id,
                booking.title,
                booking.start_time.strftime(
                    "%Y-%m-%d %H:%M"
                ),
                booking.end_time.strftime(
                    "%Y-%m-%d %H:%M"
                ),
                booking.status,
            ]
        )

    table = Table(
        data,
        repeatRows=1,
        colWidths=[
            60,
            60,
            60,
            180,
            120,
            120,
            90,
        ],
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.lightgrey,
                ),
                (
                    "TEXTCOLOR",
                    (0, 0),
                    (-1, 0),
                    colors.black,
                ),
                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),
                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),
                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),
                (
                    "ALIGN",
                    (0, 0),
                    (-1, -1),
                    "CENTER",
                ),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [
                        colors.white,
                        colors.whitesmoke,
                    ],
                ),
            ]
        )
    )

    elements.append(table)

    document.build(elements)

    output.seek(0)

    return output