from pathlib import Path
from io import BytesIO
import fitz
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
assets = root / 'public' / 'assets'
out = root / 'brand'
out.mkdir(exist_ok=True)

def svg(name, size):
    document = fitz.open(stream=(assets / name).read_bytes(), filetype='svg')
    pix = document[0].get_pixmap(matrix=fitz.Matrix(size/128, size/128), alpha=True)
    return Image.open(BytesIO(pix.tobytes('png'))).convert('RGBA')

mark = svg('yasapps-symbol.svg', 1024)
mark.save(out / 'yasapps-symbol.png')
dark = svg('yasapps-symbol-dark.svg', 1024)
dark.save(out / 'yasapps-symbol-dark.png')
font_dir = Path('C:/Windows/Fonts')
def font(size, bold=False):
    return ImageFont.truetype(str(font_dir / ('segoeuib.ttf' if bold else 'segoeui.ttf')), size)

wordmark = Image.new('RGBA', (1200, 320), (0, 0, 0, 0))
wordmark.paste(svg('yasapps-symbol.svg', 280), (10, 10), svg('yasapps-symbol.svg', 280))
wd = ImageDraw.Draw(wordmark)
wd.text((322, 67), 'yas', font=font(172, True), fill='#152544')
w1 = wd.textlength('yas', font=font(172, True))
wd.text((322+w1-6, 67), 'apps', font=font(172), fill='#52617A')
w2 = wd.textlength('apps', font=font(172))
wd.text((322+w1+w2-14, 67), '.', font=font(172, True), fill='#2563EB')
wordmark.save(out / 'yasapps-wordmark.png')

board = Image.new('RGB', (1600, 1040), '#F4F7FC')
d = ImageDraw.Draw(board)
d.text((72, 49), 'YAS APPS / PARENT IDENTITY', font=font(15, True), fill='#73819A')
d.text((72, 87), 'Open Wings', font=font(57, True), fill='#152544')
d.text((73, 167), 'One family. Its own identity.', font=font(23), fill='#65728B')
d.rounded_rectangle((60, 235, 1540, 655), radius=24, fill='#FFFFFF', outline='#DFE5EF', width=2)
board.paste(svg('yasapps-symbol.svg', 240), (110, 303), svg('yasapps-symbol.svg', 240))
d.text((365, 351), 'yas', font=font(105, True), fill='#152544')
advance=d.textlength('yas', font=font(105,True))
d.text((365+advance-3, 351), 'apps', font=font(105), fill='#52617A')
advance2=d.textlength('apps', font=font(105))
d.text((365+advance+advance2-7, 351), '.', font=font(105,True), fill='#2563EB')
d.text((373, 498), 'BUILT IN THE UAE. OPEN TO THE WORLD.', font=font(14,True), fill='#71839E')
d.rounded_rectangle((1080, 269, 1507, 620), radius=19, fill='#152544')
small=svg('yasapps-symbol-dark.svg', 195)
board.paste(small,(1196,312),small)
d.text((1168, 539), 'Dark-background symbol', font=font(17), fill='#ADBBD2')
d.text((74, 708), 'THE FAMILY CONNECTION', font=font(14,True), fill='#73819A')
d.text((74, 745), 'Shared colors. Different roles.', font=font(29,True), fill='#152544')
for x, filename, label, role in [(78,'yasapps-symbol.svg','Yas Apps','The parent brand'),(578,'browser.svg','Yas Browser','The falcon / browse'),(1080,'mail.svg','Yas Mail','The wing letter / email')]:
    icon=svg(filename,90)
    board.paste(icon,(x,825),icon)
    d.text((x+110,837),label,font=font(23,True),fill='#152544')
    d.text((x+110,877),role,font=font(17),fill='#71839E')
d.line((72, 958, 1528, 958), fill='#DFE5EF', width=2)
d.text((73, 981), 'Royal blue  #2563EB    /    Sky blue  #86B9FF    /    Fold blue  #1747B1', font=font(16), fill='#73819A')
board.save(out / 'yasapps-brand-preview.png')
print('SVG masters, transparent PNG symbols, and brand preview ready.')
