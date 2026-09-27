import type { LessonBody } from "./lessons";

/**
 * Python lessons added after the first curriculum audit. They deliberately
 * separate guided instruction from low-scaffold checkpoints: passing a recipe
 * you have just seen is practice; solving a fresh brief is evidence of transfer.
 */
export const pythonLessonBodies: Record<string, LessonBody> = {
  "py-basics.functions": {
    summary:
      "Define a function, pass values into it, and return a result before later lessons ask you to build with functions.",
    xp: 110,
    blocks: [
      {
        kind: "text",
        body: "A **function** gives a small job a name. Define it with `def`, put its inputs (the **parameters**) in parentheses, and indent the body. Defining a function does not run it. Call it by writing its name with values in parentheses.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Define once, call with different values",
        code: `def area(width, height):
    return width * height

small = area(3, 4)
large = area(10, 8)
print(small, large)  # 12 80`,
      },
      {
        kind: "text",
        body: "`return` hands a value back to the calling code. `print` only displays something. If a function has no `return`, its result is `None`. Keep calculations inside the function and decide where to print outside it; that makes the function reusable and testable.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Returning and printing are different jobs",
        code: `def greeting(name):
    return f"Hello, {name}!"

message = greeting("Ada")
print(message.upper())  # HELLO, ADA!`,
      },
      {
        kind: "text",
        body: "Names created inside a function are **local** to that call. Give a function everything it needs as parameters instead of relying on mystery values elsewhere in the file. Later you will learn defaults and keyword arguments; for now, make every required input explicit.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What is stored in `answer` after `answer = area(3, 4)`?",
        options: ["The text '3 * 4'", "12", "None", "The function itself"],
        answer: 1,
        explanation: "The arguments become width and height, and return hands their product back.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the line that hands the doubled number back to the caller.",
        before: "def double(number):\n    ",
        after: " number * 2",
        answer: "return",
        explanation: "return gives the calculated value to the code that called the function.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Reusable receipt helpers",
        prompt:
          "Write `line_total(price, quantity)`, which returns their product, and `receipt_line(item, price, quantity)`, which returns text like `3 x Notebook = $7.50`. Use `line_total` inside `receipt_line`, and format the amount to two decimals.",
        language: "python",
        starter: `def line_total(price, quantity):
    # Return the calculated number.
    pass

def receipt_line(item, price, quantity):
    # Call line_total rather than repeating its calculation.
    pass

print(receipt_line("Notebook", 2.5, 3))`,
        hint: "Call a function just like any other expression. In an f-string, `{amount:.2f}` formats a number to two decimal places.",
        solution: `def line_total(price, quantity):
    return price * quantity

def receipt_line(item, price, quantity):
    amount = line_total(price, quantity)
    return f"{quantity} x {item} = \${amount:.2f}"`,
        tests: [
          { name: "Calculates a line total", expression: "line_total(2.5, 3) == 7.5" },
          { name: "Works with a zero quantity", expression: "line_total(10, 0) == 0" },
          {
            name: "Builds and formats the receipt line",
            expression: 'receipt_line("Notebook", 2.5, 3) == "3 x Notebook = $7.50"',
          },
          {
            name: "Uses line_total instead of duplicating the calculation",
            expression:
              '(lambda original: (globals().__setitem__("line_total", lambda price, quantity: 99), receipt_line("Test", 1, 1), globals().__setitem__("line_total", original))[1])(line_total) == "1 x Test = $99.00"',
          },
        ],
      },
    ],
  },

  "py-basics.checkpoint": {
    summary:
      "Combine values, functions and conditionals in a fresh problem with almost no starter code.",
    xp: 170,
    blocks: [
      {
        kind: "callout",
        body: "This is a mastery checkpoint, not another worked example. Start from the brief, run small cases, and use the hint only after you have a plan. Getting stuck is useful evidence about what to revisit.",
      },
      {
        kind: "text",
        body: "Before coding, turn prose into cases. Write down the normal price, each discount, and the boundary values where the answer changes. For this task those boundaries include ages 12, 13, 64 and 65. Tests love boundaries because that is where vague thinking becomes a bug.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which ages should you test to check both sides of the senior boundary at 65?",
        options: ["0 and 100", "65 and 66", "Only 65", "64 and 65"],
        answer: 3,
        explanation: "64 is the final non-senior value and 65 is the first senior value.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the condition for an age from 13 through 64, inclusive.",
        before: "if ",
        after: ":",
        answer: "13 <= age <= 64",
        accept: ["age >= 13 and age <= 64"],
        explanation:
          "Python supports chained comparisons, so the range reads like ordinary mathematics.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Museum fare calculator",
        prompt:
          "From a blank file, write `museum_fare(age, member=False)`. The normal fare is 20. Children under 13 pay 8; visitors 65 or older pay 12. Members receive another 25% off whichever fare applies. Return a number, not formatted text. Then write `fare_label(name, age, member=False)` returning exactly `Ada: $6.00` for a 10-year-old member named Ada. Do not print inside either function.",
        language: "python",
        starter: `# Write your solution from the brief. Decide the cases before you type.
`,
        hint: "First choose one base fare with `if` / `elif` / `else`. After that decision, apply the membership discount once. Keep formatting in `fare_label`.",
        solution: `def museum_fare(age, member=False):
    if age < 13:
        fare = 8
    elif age >= 65:
        fare = 12
    else:
        fare = 20
    if member:
        fare *= 0.75
    return fare

def fare_label(name, age, member=False):
    return f"{name}: \${museum_fare(age, member):.2f}"`,
        tests: [
          {
            name: "Handles every age band",
            expression:
              "museum_fare(12) == 8 and museum_fare(13) == 20 and museum_fare(64) == 20 and museum_fare(65) == 12",
          },
          {
            name: "Applies membership after choosing the age fare",
            expression:
              "museum_fare(10, True) == 6 and museum_fare(30, True) == 15 and museum_fare(70, True) == 9",
          },
          {
            name: "Uses the default for non-members",
            expression: "museum_fare(30) == 20",
          },
          {
            name: "Builds an exact, two-decimal label",
            expression: 'fare_label("Ada", 10, True) == "Ada: $6.00"',
          },
          {
            name: "The label uses museum_fare",
            expression:
              '(lambda original: (globals().__setitem__("museum_fare", lambda age, member=False: 7), fare_label("Test", 1), globals().__setitem__("museum_fare", original))[1])(museum_fare) == "Test: $7.00"',
          },
        ],
      },
    ],
  },

  "py-collections.loops": {
    summary:
      "Visit every item with for, keep running results in accumulators, and use enumerate when position matters.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "A `for` loop runs an indented block once for each item. Name the current item directly: `for temperature in temperatures:`. When you also need its position, `enumerate(values)` gives an index and value together. `range(1, 5)` produces 1, 2, 3 and 4—the end is not included.",
      },
      {
        kind: "code",
        language: "python",
        caption: "The accumulator pattern",
        code: `total = 0
for temperature in [12, 15, 9]:
    total += temperature

average = total / 3
print(average)  # 12.0`,
      },
      {
        kind: "text",
        body: "An **accumulator** is a value you create before the loop and update inside it. Start with `0` for a sum or count, and `[]` when collecting results. Return only after the loop has finished; returning inside it accidentally stops after the first item.",
      },
      {
        kind: "code",
        language: "python",
        caption: "Keep both the position and the value",
        code: `matches = []
for index, item in enumerate(["map", "tent", "map"]):
    if item == "map":
        matches.append(index)

print(matches)  # [0, 2]`,
      },
      {
        kind: "callout",
        body: "Do not add or remove items from the same list you are looping over; positions shift and items can be skipped. Collect into a new list, or loop over a copy.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "Which numbers does `range(1, 5)` produce?",
        options: ["1, 2, 3, 4", "1, 2, 3, 4, 5", "0, 1, 2, 3, 4", "Only 1 and 5"],
        answer: 0,
        explanation: "A range includes its start and stops before its end.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the loop header when you need both each index and value.",
        before: "for index, value in ",
        after: "(values):",
        answer: "enumerate",
        explanation: "enumerate yields a pair containing the position and the value.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Loops over readings",
        prompt:
          "Write three functions using loops. `running_totals(values)` returns each running sum (`[3, 1, 4]` becomes `[3, 4, 8]`). `count_above(values, threshold)` counts values strictly greater than the threshold. `positions(items, target)` returns every matching index.",
        language: "python",
        starter: `def running_totals(values):
    pass

def count_above(values, threshold):
    pass

def positions(items, target):
    pass`,
        hint: "Choose an initial accumulator for each function: either `0` or `[]`. Update it inside the loop, and return it after the loop.",
        solution: `def running_totals(values):
    totals = []
    total = 0
    for value in values:
        total += value
        totals.append(total)
    return totals

def count_above(values, threshold):
    count = 0
    for value in values:
        if value > threshold:
            count += 1
    return count

def positions(items, target):
    found = []
    for index, item in enumerate(items):
        if item == target:
            found.append(index)
    return found`,
        tests: [
          { name: "Builds running totals", expression: "running_totals([3, 1, 4]) == [3, 4, 8]" },
          { name: "Handles an empty list", expression: "running_totals([]) == []" },
          {
            name: "Counts values strictly above the threshold",
            expression: "count_above([5, 12, 9, 20, 10], 10) == 2",
          },
          {
            name: "Finds every matching position",
            expression: 'positions(["a", "b", "a", "c"], "a") == [0, 2]',
          },
          {
            name: "Returns an empty list when nothing matches",
            expression: 'positions(["a"], "z") == []',
          },
        ],
      },
    ],
  },

  "py-collections.checkpoint": {
    summary:
      "Turn a list of order dictionaries into a trustworthy summary without a step-by-step recipe.",
    xp: 190,
    blocks: [
      {
        kind: "callout",
        body: "Checkpoint rules: sketch the result first, start from the blank editor, and do not open the hint until you have run at least one attempt.",
      },
      {
        kind: "text",
        body: "When a task combines lists and dictionaries, identify the shape at each level. Here, `orders` is a list; each `order` is a dictionary; and the result is one new dictionary containing a list, a number and another dictionary. Naming those shapes before coding prevents most bracket mistakes.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "What should a summariser do with the input list?",
        options: [
          "Remove each order after counting it",
          "Sort it in place so processing is easier",
          "Read it and build a separate result, leaving the input unchanged",
          "Convert every dictionary to text",
        ],
        answer: 2,
        explanation:
          "A summary should not surprise its caller by changing the records it was given.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the safe counting pattern for the current status.",
        before: "counts[status] = counts.",
        after: "(status, 0) + 1",
        answer: "get",
        explanation: ".get supplies zero the first time a status appears.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Summarise the orders",
        prompt:
          "From a blank file, write `summarise_orders(orders)`. Return a dictionary with three keys: `paid_ids` (the IDs of paid orders in original order), `revenue` (the sum of paid totals), and `status_counts` (how many orders have each status). An empty input returns empty IDs, zero revenue and an empty counts dictionary. Do not modify `orders` or its dictionaries.",
        language: "python",
        starter: `# Write summarise_orders from the brief. Begin by drawing the result shape.
`,
        hint: "Create all three accumulators before one loop. Count every status, but add an ID and total only when the status is `paid`.",
        solution: `def summarise_orders(orders):
    paid_ids = []
    revenue = 0
    status_counts = {}
    for order in orders:
        status = order["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
        if status == "paid":
            paid_ids.append(order["id"])
            revenue += order["total"]
    return {
        "paid_ids": paid_ids,
        "revenue": revenue,
        "status_counts": status_counts,
    }`,
        tests: [
          {
            name: "Builds all three parts of the summary",
            expression:
              'summarise_orders([{"id": 1, "total": 30, "status": "paid"}, {"id": 2, "total": 99, "status": "pending"}, {"id": 3, "total": 12, "status": "paid"}]) == {"paid_ids": [1, 3], "revenue": 42, "status_counts": {"paid": 2, "pending": 1}}',
          },
          {
            name: "Handles an empty input",
            expression:
              'summarise_orders([]) == {"paid_ids": [], "revenue": 0, "status_counts": {}}',
          },
          {
            name: "Does not count refunded totals as revenue",
            expression:
              'summarise_orders([{"id": 7, "total": 50, "status": "refunded"}])["revenue"] == 0',
          },
          {
            name: "Leaves the input unchanged",
            expression:
              '(lambda orders, before: (summarise_orders(orders), orders == before)[1])([{"id": 1, "total": 5, "status": "paid"}], [{"id": 1, "total": 5, "status": "paid"}])',
          },
        ],
      },
    ],
  },

  "py-tools.local": {
    summary:
      "Move from the browser to a real .py file, run it in a terminal, and make file paths independent of the current folder.",
    xp: 130,
    blocks: [
      {
        kind: "text",
        body: "The browser editor is useful practice, but a local script is the transferable skill. Install a current Python 3 release from python.org or your organisation's approved software source. Then open a terminal and check it. On macOS or Linux, try `python3 --version`; on Windows, try `py --version`. A version beginning with 3 means the command is ready.",
      },
      {
        kind: "code",
        language: "text",
        caption: "Create report.py in a folder, move the terminal there, then run it",
        code: `# macOS / Linux
cd path/to/my-report
python3 report.py

# Windows PowerShell
cd path\\to\\my-report
py report.py`,
      },
      {
        kind: "text",
        body: "The terminal and Python report different failures. `command not found` or 'not recognized' means the shell could not find Python. `can't open file` means Python started but the script path is wrong. A Python traceback means it found and ran your file; read that traceback from the bottom up.",
      },
      {
        kind: "text",
        body: "A relative path is interpreted from the terminal's **current working directory**, which may not be the script's folder. For files shipped beside a script, build from `Path(__file__).resolve().parent`. For paths the user provides, accept them as parameters instead of burying one machine's folder name in the code.",
      },
      {
        kind: "code",
        language: "python",
        caption: "A path beside the script",
        code: `from pathlib import Path

HERE = Path(__file__).resolve().parent
sales_path = HERE / "sales.csv"
print(sales_path)`,
      },
      {
        kind: "text",
        body: "Command-line arguments let one script work on different files. `sys.argv[0]` is the script name and later items are what the user typed: `python3 report.py april.csv`. A larger application may use `argparse`, but accepting a path as a function parameter is enough for this course's automation.",
      },
      {
        kind: "mcq",
        id: "q1",
        question: "`python3: command not found` appears before any traceback. What failed?",
        options: [
          "The Python code has a syntax error",
          "The shell could not find a command named python3",
          "report.py is empty",
          "The CSV has a bad row",
        ],
        answer: 1,
        explanation:
          "Python did not start. Check the installation and the correct command for that system.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the pathlib expression for the folder containing the running script.",
        before: "HERE = Path(__file__).resolve().",
        after: "",
        answer: "parent",
        explanation: "resolve makes the path absolute and parent selects the containing folder.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Put the report beside its input",
        prompt:
          "Write `report_path(input_path)`. Return a `Path` in the same folder whose filename adds `-summary` before the extension. `data/april.sales.csv` becomes `data/april.sales-summary.csv`; `sales` becomes `sales-summary.csv`. Do not manually split on `/` or `\\`—use `pathlib`.",
        language: "python",
        starter: `from pathlib import Path

def report_path(input_path):
    pass`,
        hint: "Create `path = Path(input_path)`. Its `parent` is the folder and `stem` is the final filename without its last suffix. Use `.with_name(...)` to replace only the name.",
        solution: `from pathlib import Path

def report_path(input_path):
    path = Path(input_path)
    return path.with_name(path.stem + "-summary.csv")`,
        tests: [
          {
            name: "Keeps the input folder",
            expression: 'str(report_path("data/april.csv")) == "data/april-summary.csv"',
          },
          {
            name: "Handles more than one dot",
            expression:
              'str(report_path("reports/april.sales.csv")) == "reports/april.sales-summary.csv"',
          },
          {
            name: "Adds a CSV suffix when the input has none",
            expression: 'str(report_path("sales")) == "sales-summary.csv"',
          },
          {
            name: "Returns a Path rather than plain text",
            expression: 'isinstance(report_path("sales.csv"), Path)',
          },
        ],
      },
    ],
  },

  "py-project.inventory": {
    summary:
      "Build a second file-processing automation from a fresh brief, including validation and exact money arithmetic.",
    xp: 250,
    blocks: [
      {
        kind: "callout",
        body: "This is the independent capstone. It deliberately does not repeat the sales-report recipe. Use earlier lessons as references, but make your own plan before opening the hint.",
      },
      {
        kind: "text",
        body: 'Reliable automation has an explicit contract: required columns, valid values, output order, error behaviour and a summary of what it skipped. `Decimal` is used for money because binary floating-point cannot represent many decimal amounts exactly. Construct it from CSV text, not from a float: `Decimal(row["unit_price"])`.',
      },
      {
        kind: "text",
        body: "Treat a missing file differently from a bad row. Let `FileNotFoundError` explain that the requested input does not exist. Reject a wrong header with a clear `ValueError`. Skip individual malformed records and report the number skipped so the output is useful without pretending every source row was valid.",
      },
      {
        kind: "mcq",
        id: "q1",
        question:
          "Why build a price with `Decimal` from its CSV text rather than converting the text to float first?",
        options: [
          "Converting through float can preserve a binary rounding error in the Decimal",
          "Decimal can only read strings",
          "float cannot read decimal text",
          "CSV files reject floats",
        ],
        answer: 0,
        explanation:
          "Start from the original decimal text so the exact written amount is preserved.",
      },
      {
        kind: "fill",
        id: "f1",
        prompt: "Complete the exception type raised when a required CSV column is missing.",
        before: "raise ",
        after: '("CSV must contain sku, name, quantity, unit_price")',
        answer: "ValueError",
        explanation:
          "The file exists, but its value/shape violates the function's documented input contract.",
      },
      {
        kind: "challenge",
        id: "c1",
        title: "Inventory reorder report",
        prompt:
          'Write `build_reorder_report(in_path, out_path, reorder_below=5)`. Read CSV columns `sku,name,quantity,unit_price`. If any required column is absent, raise `ValueError("CSV must contain sku, name, quantity, unit_price")`. Skip rows with a blank SKU/name, a non-whole or negative quantity, or an invalid/negative price. Write valid products whose quantity is below `reorder_below` to `out_path` with header `sku,name,quantity,unit_price,stock_value`, ordered by quantity then SKU. Format both money columns to two decimals using `Decimal`. Return `(rows_used, rows_skipped, reorder_rows)`.',
        language: "python",
        starter: `import csv
from decimal import Decimal, InvalidOperation

INVENTORY = """sku,name,quantity,unit_price
B2,Headlamp,2,35.00
A1,Tent,8,180.00
C3,Stove,4,74.50
BAD,Broken,n/a,12.00
D4,,1,9.00
"""
with open("inventory.csv", "w", encoding="utf-8", newline="") as file:
    file.write(INVENTORY)

def captured_error(call):
    """Testing helper. Do not change it."""
    try:
        call()
    except Exception as error:
        return type(error).__name__, str(error)
    return None

# Write build_reorder_report from the brief. No function skeleton is provided.
`,
        hint: "Validate `reader.fieldnames` once. For each row, strip text and parse quantity and Decimal inside a narrow try/except. Store valid reorder rows, sort with `key=lambda row: (row[2], row[0])`, then write them. Keep three counters with distinct meanings.",
        solution: `import csv
from decimal import Decimal, InvalidOperation

INVENTORY = """sku,name,quantity,unit_price
B2,Headlamp,2,35.00
A1,Tent,8,180.00
C3,Stove,4,74.50
BAD,Broken,n/a,12.00
D4,,1,9.00
"""
with open("inventory.csv", "w", encoding="utf-8", newline="") as file:
    file.write(INVENTORY)

def captured_error(call):
    """Testing helper. Do not change it."""
    try:
        call()
    except Exception as error:
        return type(error).__name__, str(error)
    return None

def build_reorder_report(in_path, out_path, reorder_below=5):
    required = {"sku", "name", "quantity", "unit_price"}
    valid_rows = []
    skipped = 0

    with open(in_path, encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("CSV must contain sku, name, quantity, unit_price")
        for row in reader:
            sku = row["sku"].strip()
            name = row["name"].strip()
            try:
                quantity = int(row["quantity"])
                price = Decimal(row["unit_price"])
            except (ValueError, InvalidOperation):
                skipped += 1
                continue
            if not sku or not name or quantity < 0 or not price.is_finite() or price < 0:
                skipped += 1
                continue
            valid_rows.append((sku, name, quantity, price))

    reorder = [row for row in valid_rows if row[2] < reorder_below]
    reorder.sort(key=lambda row: (row[2], row[0]))
    with open(out_path, "w", encoding="utf-8", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["sku", "name", "quantity", "unit_price", "stock_value"])
        for sku, name, quantity, price in reorder:
            writer.writerow([sku, name, quantity, f"{price:.2f}", f"{price * quantity:.2f}"])
    return len(valid_rows), skipped, len(reorder)`,
        tests: [
          {
            name: "Reports valid, skipped and reorder row counts",
            expression: 'build_reorder_report("inventory.csv", "reorder.csv") == (3, 2, 2)',
          },
          {
            name: "Writes ordered rows with exact formatted money",
            expression:
              'build_reorder_report("inventory.csv", "reorder.csv") and open("reorder.csv", encoding="utf-8").read().splitlines() == ["sku,name,quantity,unit_price,stock_value", "B2,Headlamp,2,35.00,70.00", "C3,Stove,4,74.50,298.00"]',
          },
          {
            name: "Honours a different reorder threshold",
            expression: 'build_reorder_report("inventory.csv", "reorder.csv", 3) == (3, 2, 1)',
          },
          {
            name: "Rejects a file with missing columns",
            expression:
              '(open("bad-header.csv", "w", encoding="utf-8", newline="").write("sku,name,quantity\\nA1,Tent,2\\n") > 0) and captured_error(lambda: build_reorder_report("bad-header.csv", "out.csv")) == ("ValueError", "CSV must contain sku, name, quantity, unit_price")',
          },
          {
            name: "Works on a different valid file without relying on the fixture",
            expression:
              '(open("other-inventory.csv", "w", encoding="utf-8", newline="").write("sku,name,quantity,unit_price\\nZ9,Cable,0,1.25\\n") > 0) and build_reorder_report("other-inventory.csv", "other-reorder.csv") == (1, 0, 1) and open("other-reorder.csv", encoding="utf-8").read().splitlines()[1] == "Z9,Cable,0,1.25,0.00"',
          },
        ],
      },
    ],
  },
};
