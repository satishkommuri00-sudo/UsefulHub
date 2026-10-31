"use strict";

document.addEventListener("DOMContentLoaded", function () {

  /* =========================================
     1. SCIENTIFIC + ML CALCULATOR
  ========================================= */

  (() => {

    const $ = (id) => document.getElementById(id);
    const root = $("calculatorTool");

    // Stop calculator code if calculator HTML is not present
    if (!root || !root.classList.contains("uh-ml-calculator")) {
      return;
    }

    let angleMode = "DEG";

    const result = $("uhCalcResult");
    const status = $("uhCalcStatus");

    const fmt = (n) => {
      if (!Number.isFinite(n)) {
        throw new Error("The result is not a finite number.");
      }

      if (Object.is(n, -0)) n = 0;

      return Number(n.toPrecision(12)).toString();
    };

    const showError = (element, error) => {
      if (!element) return;

      element.textContent =
        "Error: " + (error?.message || String(error));
    };

    const parseNumbers = (text) => {
      const values = text
        .trim()
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(Number);

      if (
        !values.length ||
        values.some((value) => !Number.isFinite(value))
      ) {
        throw new Error(
          "Enter valid comma-separated numbers."
        );
      }

      return values;
    };

    const sameLength = (a, b) => {
      if (a.length !== b.length) {
        throw new Error(
          "Both vectors must contain the same number of values."
        );
      }
    };

    const dot = (a, b) => {
      sameLength(a, b);

      return a.reduce(
        (sum, value, index) =>
          sum + value * b[index],
        0
      );
    };

    const parseMatrix = (text) => {

      const rows = text
        .trim()
        .split(/\n|;/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line
            .split(/[,\s]+/)
            .filter(Boolean)
            .map(Number)
        );

      if (
        !rows.length ||
        rows.some(
          (row) =>
            !row.length ||
            row.some(
              (number) => !Number.isFinite(number)
            )
        )
      ) {
        throw new Error(
          "Enter a valid matrix. Separate numbers with commas and rows with new lines."
        );
      }

      if (
        rows.some(
          (row) => row.length !== rows[0].length
        )
      ) {
        throw new Error(
          "Every matrix row must have the same number of columns."
        );
      }

      return rows;
    };

    const matrixText = (matrix) =>
      matrix
        .map(
          (row) =>
            "[ " +
            row.map(fmt).join(",  ") +
            " ]"
        )
        .join("\n");

    const transpose = (matrix) =>
      matrix[0].map(
        (_, column) =>
          matrix.map((row) => row[column])
      );


    /* =========================================
       MATRIX DETERMINANT
    ========================================= */

    function determinant(matrix) {

      if (matrix.length !== matrix[0].length) {
        throw new Error(
          "Determinant requires a square matrix."
        );
      }

      const m = matrix.map((row) => row.slice());
      let det = 1;

      for (let i = 0; i < m.length; i++) {

        let pivotRow = i;

        for (
          let row = i + 1;
          row < m.length;
          row++
        ) {
          if (
            Math.abs(m[row][i]) >
            Math.abs(m[pivotRow][i])
          ) {
            pivotRow = row;
          }
        }

        if (Math.abs(m[pivotRow][i]) < 1e-12) {
          return 0;
        }

        if (pivotRow !== i) {
          [m[pivotRow], m[i]] =
            [m[i], m[pivotRow]];

          det *= -1;
        }

        const pivot = m[i][i];
        det *= pivot;

        for (
          let row = i + 1;
          row < m.length;
          row++
        ) {
          const factor =
            m[row][i] / pivot;

          for (
            let column = i + 1;
            column < m.length;
            column++
          ) {
            m[row][column] -=
              factor * m[i][column];
          }
        }
      }

      return det;
    }


    /* =========================================
       MATRIX INVERSE
    ========================================= */

    function inverse(matrix) {

      if (matrix.length !== matrix[0].length) {
        throw new Error(
          "Inverse requires a square matrix."
        );
      }

      const n = matrix.length;

      const m = matrix.map((row, i) =>
        row.slice().concat(
          row.map((_, j) =>
            i === j ? 1 : 0
          )
        )
      );

      for (let i = 0; i < n; i++) {

        let pivotRow = i;

        for (
          let row = i + 1;
          row < n;
          row++
        ) {
          if (
            Math.abs(m[row][i]) >
            Math.abs(m[pivotRow][i])
          ) {
            pivotRow = row;
          }
        }

        if (Math.abs(m[pivotRow][i]) < 1e-12) {
          throw new Error(
            "This matrix is singular and has no inverse."
          );
        }

        [m[pivotRow], m[i]] =
          [m[i], m[pivotRow]];

        const pivot = m[i][i];

        m[i] = m[i].map(
          (value) => value / pivot
        );

        for (let row = 0; row < n; row++) {

          if (row === i) continue;

          const factor = m[row][i];

          m[row] = m[row].map(
            (value, column) =>
              value - factor * m[i][column]
          );
        }
      }

      return m.map(
        (row) => row.slice(n)
      );
    }


    /* =========================================
       SCIENTIFIC EXPRESSION PARSER
    ========================================= */

    function evaluateExpression(source) {

      const s = source
        .replace(/π/g, "pi")
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-")
        .trim();

      if (!s) {
        throw new Error(
          "Enter an expression first."
        );
      }

      if (!/^[\w.+\-*/%^!(),\s]+$/.test(s)) {
        throw new Error(
          "Expression contains an unsupported character."
        );
      }

      const tokens = [];

      const re =
        /\s*(?:(\d+(?:\.\d*)?|\.\d+)([eE][+-]?\d+)?|([A-Za-z]+)|(\*\*|[+\-*/%^!(),]))/gy;

      let pos = 0;

      while (pos < s.length) {

        re.lastIndex = pos;

        const match = re.exec(s);

        if (!match) {
          throw new Error(
            "Could not read expression near: " +
            s.slice(pos, pos + 12)
          );
        }

        pos = re.lastIndex;

        if (match[1] !== undefined) {

          tokens.push({
            t: "num",
            v: Number(
              match[1] +
              (match[2] || "")
            )
          });

        } else if (match[3]) {

          tokens.push({
            t: "name",
            v: match[3].toLowerCase()
          });

        } else {

          tokens.push({
            t:
              match[4] === "**"
                ? "^"
                : match[4]
          });
        }
      }

      let i = 0;

      const peek = () =>
        tokens[i] || { t: "end" };

      const eat = (type) => {

        if (peek().t !== type) {
          throw new Error(
            "Expected '" + type + "'."
          );
        }

        return tokens[i++];
      };

      const toAngle = (x) =>
        angleMode === "DEG"
          ? x * Math.PI / 180
          : x;

      const fromAngle = (x) =>
        angleMode === "DEG"
          ? x * 180 / Math.PI
          : x;

      const funcs = {

        sin: (x) =>
          Math.sin(toAngle(x)),

        cos: (x) =>
          Math.cos(toAngle(x)),

        tan: (x) =>
          Math.tan(toAngle(x)),

        asin: (x) =>
          fromAngle(Math.asin(x)),

        acos: (x) =>
          fromAngle(Math.acos(x)),

        atan: (x) =>
          fromAngle(Math.atan(x)),

        sqrt: (x) =>
          Math.sqrt(x),

        abs: (x) =>
          Math.abs(x),

        log: (x) =>
          Math.log10(x),

        ln: (x) =>
          Math.log(x),

        exp: (x) =>
          Math.exp(x),

        floor: (x) =>
          Math.floor(x),

        ceil: (x) =>
          Math.ceil(x),

        round: (x) =>
          Math.round(x)
      };


      function primary() {

        const token = peek();

        if (
          token.t === "+" ||
          token.t === "-"
        ) {
          i++;

          const value = primary();

          return token.t === "-"
            ? -value
            : value;
        }

        if (token.t === "num") {
          i++;
          return token.v;
        }

        if (token.t === "(") {

          i++;

          const value = add();

          eat(")");

          return value;
        }

        if (token.t === "name") {

          i++;

          if (token.v === "pi") {
            return Math.PI;
          }

          if (token.v === "e") {
            return Math.E;
          }

          if (!(token.v in funcs)) {
            throw new Error(
              "Unknown function or constant: " +
              token.v
            );
          }

          eat("(");

          const argument = add();

          eat(")");

          return funcs[token.v](argument);
        }

        throw new Error(
          "Expected a number, constant, function, or parenthesis."
        );
      }


      function postfix() {

        let value = primary();

        while (
          peek().t === "!" ||
          peek().t === "%"
        ) {

          const op = tokens[i++].t;

          if (op === "!") {

            if (
              value < 0 ||
              value > 170 ||
              !Number.isInteger(value)
            ) {
              throw new Error(
                "Factorial requires an integer from 0 to 170."
              );
            }

            let factorial = 1;

            for (
              let k = 2;
              k <= value;
              k++
            ) {
              factorial *= k;
            }

            value = factorial;

          } else {

            value /= 100;
          }
        }

        return value;
      }


      function power() {

        let value = postfix();

        if (peek().t === "^") {

          i++;

          value = Math.pow(
            value,
            unary()
          );
        }

        return value;
      }


      function unary() {

        if (
          peek().t === "+" ||
          peek().t === "-"
        ) {

          const op = tokens[i++].t;

          const value = unary();

          return op === "-"
            ? -value
            : value;
        }

        return power();
      }


      function multiplyDivide() {

        let value = unary();

        while (
          ["*", "/", "%"].includes(
            peek().t
          )
        ) {

          const op = tokens[i++].t;

          const b = unary();

          if (
            (op === "/" || op === "%") &&
            b === 0
          ) {
            throw new Error(
              "Cannot divide by zero."
            );
          }

          if (op === "*") {
            value *= b;
          } else if (op === "/") {
            value /= b;
          } else {
            value %= b;
          }
        }

        return value;
      }


      // THIS FUNCTION WAS BROKEN IN YOUR OLD CODE
      function add() {

        let value = multiplyDivide();

        while (
          peek().t === "+" ||
          peek().t === "-"
        ) {

          const op = tokens[i++].t;

          const b = multiplyDivide();

          value =
            op === "+"
              ? value + b
              : value - b;
        }

        return value;
      }


      const answer = add();

      if (peek().t !== "end") {
        throw new Error(
          "Unexpected token: " +
          peek().t
        );
      }

      if (!Number.isFinite(answer)) {
        throw new Error(
          "The result is not a finite number."
        );
      }

      return answer;
    }


    /* =========================================
       CALCULATOR TABS
    ========================================= */

    root
      .querySelectorAll(".uh-tab")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            root
              .querySelectorAll(".uh-tab")
              .forEach((btn) => {

                const active =
                  btn === button;

                btn.classList.toggle(
                  "is-active",
                  active
                );

                btn.setAttribute(
                  "aria-selected",
                  String(active)
                );
              });

            root
              .querySelectorAll(".uh-calc-panel")
              .forEach((panel) => {

                const active =
                  panel.id ===
                  button.dataset.panel;

                panel.classList.toggle(
                  "is-visible",
                  active
                );

                panel.hidden = !active;
              });
          }
        );
      });


    /* =========================================
       DEGREE / RADIAN
    ========================================= */

    function setAngle(mode) {

      angleMode = mode;

      [
        ["uhDegrees", "DEG"],
        ["uhRadians", "RAD"]
      ].forEach(([id, value]) => {

        const button = $(id);

        if (!button) return;

        const active =
          value === mode;

        button.classList.toggle(
          "is-selected",
          active
        );

        button.setAttribute(
          "aria-pressed",
          String(active)
        );
      });
    }

    if ($("uhDegrees")) {
      $("uhDegrees").addEventListener(
        "click",
        () => setAngle("DEG")
      );
    }

    if ($("uhRadians")) {
      $("uhRadians").addEventListener(
        "click",
        () => setAngle("RAD")
      );
    }


    /* =========================================
       SCIENTIFIC CALCULATE
    ========================================= */

    function calculateScientific() {

      try {

        result.textContent =
          fmt(
            evaluateExpression(
              $("uhExpression").value
            )
          );

        status.textContent =
          "Calculated successfully · " +
          angleMode +
          " mode";

      } catch (error) {

        showError(result, error);

        status.textContent =
          "Check your expression and try again.";
      }
    }


    /* =========================================
       SCIENTIFIC KEYPAD
    ========================================= */

    if ($("uhKeypad")) {

      $("uhKeypad").addEventListener(
        "click",
        (event) => {

          const button =
            event.target.closest("button");

          if (!button) return;

          const input =
            $("uhExpression");

          const action =
            button.dataset.action;

          if (action === "clear") {

            input.value = "";

            result.textContent =
              "Your answer will appear here.";

            status.textContent =
              "Cleared.";

            input.focus();

            return;
          }

          if (action === "backspace") {

            const start =
              input.selectionStart ??
              input.value.length;

            const end =
              input.selectionEnd ??
              start;

            const from =
              start === end
                ? Math.max(0, start - 1)
                : start;

            input.setRangeText(
              "",
              from,
              end,
              "end"
            );

            input.focus();

            return;
          }

          if (action === "calculate") {

            calculateScientific();

            return;
          }

          if (
            button.dataset.insert !== undefined
          ) {

            const start =
              input.selectionStart ??
              input.value.length;

            const end =
              input.selectionEnd ??
              start;

            input.setRangeText(
              button.dataset.insert,
              start,
              end,
              "end"
            );

            input.focus();
          }
        }
      );
    }


    if ($("uhExpression")) {

      $("uhExpression").addEventListener(
        "keydown",
        (event) => {

          if (event.key === "Enter") {

            event.preventDefault();

            calculateScientific();
          }
        }
      );

      $("uhExpression").addEventListener(
        "input",
        () => {

          status.textContent =
            "Expression edited. Press = to calculate.";
        }
      );
    }


    /* =========================================
       STATISTICS
    ========================================= */

    if ($("uhStatsCalculate")) {

      $("uhStatsCalculate").addEventListener(
        "click",
        () => {

          const output =
            $("uhStatsResult");

          try {

            const values =
              parseNumbers(
                $("uhDataSet").value
              ).sort((a, b) => a - b);

            const n = values.length;

            const mean =
              values.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) / n;

            const variance =
              values.reduce(
                (sum, value) =>
                  sum +
                  (value - mean) ** 2,
                0
              ) / n;

            const median =
              n % 2
                ? values[(n - 1) / 2]
                : (
                    values[n / 2 - 1] +
                    values[n / 2]
                  ) / 2;

            output.textContent = [

              "Count: " + n,

              "Mean: " + fmt(mean),

              "Median: " + fmt(median),

              "Minimum: " +
                fmt(values[0]),

              "Maximum: " +
                fmt(values[n - 1]),

              "Range: " +
                fmt(
                  values[n - 1] -
                  values[0]
                ),

              "Population variance: " +
                fmt(variance),

              "Population standard deviation: " +
                fmt(Math.sqrt(variance)),

              "Sample variance: " +
                (
                  n > 1
                    ? fmt(
                        variance *
                        n /
                        (n - 1)
                      )
                    : "Not defined for one value"
                ),

              "Sample standard deviation: " +
                (
                  n > 1
                    ? fmt(
                        Math.sqrt(
                          variance *
                          n /
                          (n - 1)
                        )
                      )
                    : "Not defined for one value"
                )

            ].join("\n");

          } catch (error) {

            showError(output, error);
          }
        }
      );
    }


    /* =========================================
       MATRIX OPERATIONS
    ========================================= */

    if ($("uhMatrixCalculate")) {

      $("uhMatrixCalculate").addEventListener(
        "click",
        () => {

          const output =
            $("uhMatrixResult");

          try {

            const operation =
              $("uhMatrixOperation").value;

            const a =
              parseMatrix(
                $("uhMatrixA").value
              );

            const b =
              parseMatrix(
                $("uhMatrixB").value
              );

            let answer;

            if (
              operation === "transposeA"
            ) {

              answer = transpose(a);

            } else if (
              operation === "determinantA"
            ) {

              answer = [
                [determinant(a)]
              ];

            } else if (
              operation === "inverseA"
            ) {

              answer = inverse(a);

            } else if (
              operation === "dot"
            ) {

              answer = [
                [dot(a.flat(), b.flat())]
              ];

            } else if (
              operation === "add" ||
              operation === "subtract"
            ) {

              if (
                a.length !== b.length ||
                a[0].length !== b[0].length
              ) {
                throw new Error(
                  "A and B must have the same dimensions."
                );
              }

              answer = a.map(
                (row, i) =>
                  row.map(
                    (value, j) =>
                      operation === "add"
                        ? value + b[i][j]
                        : value - b[i][j]
                  )
              );

            } else {

              if (
                a[0].length !== b.length
              ) {
                throw new Error(
                  "Columns in A must equal rows in B for multiplication."
                );
              }

              answer = a.map(
                (row) =>
                  b[0].map(
                    (_, j) =>
                      row.reduce(
                        (sum, value, k) =>
                          sum +
                          value * b[k][j],
                        0
                      )
                  )
              );
            }

            output.textContent =
              matrixText(answer);

          } catch (error) {

            showError(output, error);
          }
        }
      );
    }


    /* =========================================
       MACHINE LEARNING
    ========================================= */

    const pairOps = new Set([
      "mse",
      "mae",
      "bce",
      "euclidean",
      "dot"
    ]);

    if ($("uhMlFunction")) {

      $("uhMlFunction").addEventListener(
        "change",
        () => {

          const fn =
            $("uhMlFunction").value;

          const needsPair =
            pairOps.has(fn);

          const pairWrap =
            $("uhMlPairWrap");

          if (pairWrap) {
            pairWrap.hidden = !needsPair;
          }

          const singleWrap =
            $("uhMlSingleWrap");

          if (singleWrap) {

            const label =
              singleWrap.querySelector("label");

            if (label) {

              label.textContent =
                fn === "softmax"
                  ? "Input vector"
                  : "Input value or vector";
            }
          }

          const input =
            $("uhMlInput");

          if (input) {

            input.placeholder =
              fn === "softmax"
                ? "e.g. 1, 2, 3"
                : "e.g. -2 or 1, 2, 3";
          }
        }
      );
    }


    if ($("uhMlCalculate")) {

      $("uhMlCalculate").addEventListener(
        "click",
        () => {

          const output =
            $("uhMlResult");

          try {

            const fn =
              $("uhMlFunction").value;

            const a =
              parseNumbers(
                $("uhMlInput").value
              );

            let value;

            if (fn === "sigmoid") {

              value = a.map(
                (x) =>
                  x >= 0
                    ? 1 /
                      (1 + Math.exp(-x))
                    : Math.exp(x) /
                      (1 + Math.exp(x))
              );

            } else if (fn === "relu") {

              value = a.map(
                (x) => Math.max(0, x)
              );

            } else if (
              fn === "leakyRelu"
            ) {

              value = a.map(
                (x) =>
                  x >= 0
                    ? x
                    : 0.01 * x
              );

            } else if (fn === "tanh") {

              value = a.map(Math.tanh);

            } else if (
              fn === "softmax"
            ) {

              const max =
                Math.max(...a);

              const exponents =
                a.map(
                  (x) =>
                    Math.exp(x - max)
                );

              const sum =
                exponents.reduce(
                  (total, x) =>
                    total + x,
                  0
                );

              value =
                exponents.map(
                  (x) => x / sum
                );

            } else {

              const b =
                parseNumbers(
                  $("uhMlTarget").value
                );

              sameLength(a, b);

              if (fn === "dot") {

                value = dot(a, b);

              } else if (
                fn === "euclidean"
              ) {

                value = Math.sqrt(
                  a.reduce(
                    (sum, x, i) =>
                      sum +
                      (x - b[i]) ** 2,
                    0
                  )
                );

              } else if (
                fn === "mse"
              ) {

                value =
                  a.reduce(
                    (sum, x, i) =>
                      sum +
                      (x - b[i]) ** 2,
                    0
                  ) / a.length;

              } else if (
                fn === "mae"
              ) {

                value =
                  a.reduce(
                    (sum, x, i) =>
                      sum +
                      Math.abs(x - b[i]),
                    0
                  ) / a.length;

              } else if (
                fn === "bce"
              ) {

                if (
                  b.some(
                    (y) =>
                      y !== 0 &&
                      y !== 1
                  )
                ) {
                  throw new Error(
                    "Binary cross-entropy targets must be 0 or 1."
                  );
                }

                if (
                  a.some(
                    (p) =>
                      p < 0 ||
                      p > 1
                  )
                ) {
                  throw new Error(
                    "Predicted probabilities must be between 0 and 1."
                  );
                }

                const eps = 1e-15;

                value =
                  -a.reduce(
                    (sum, p, i) => {

                      const safeP =
                        Math.max(
                          eps,
                          Math.min(
                            1 - eps,
                            p
                          )
                        );

                      return (
                        sum +
                        b[i] *
                          Math.log(safeP) +
                        (1 - b[i]) *
                          Math.log(1 - safeP)
                      );
                    },
                    0
                  ) / a.length;
              }
            }

            output.textContent =
              Array.isArray(value)
                ? "[" +
                  value
                    .map(fmt)
                    .join(", ") +
                  "]"
                : fmt(value);

          } catch (error) {

            showError(output, error);
          }
        }
      );
    }

  })();


  /* =========================================
     2. TEXT TOOLS
  ========================================= */

  const textInput =
    document.getElementById("textInput");

  const textResult =
    document.getElementById("textResult");

  const upperBtn =
    document.getElementById("upperBtn");

  const lowerBtn =
    document.getElementById("lowerBtn");

  const textClearBtn =
    document.getElementById("textClearBtn");

  if (upperBtn) {

    upperBtn.addEventListener(
      "click",
      function () {

        if (textInput && textResult) {

          textResult.textContent =
            textInput.value.toUpperCase();
        }
      }
    );
  }

  if (lowerBtn) {

    lowerBtn.addEventListener(
      "click",
      function () {

        if (textInput && textResult) {

          textResult.textContent =
            textInput.value.toLowerCase();
        }
      }
    );
  }

  if (textClearBtn) {

    textClearBtn.addEventListener(
      "click",
      function () {

        if (textInput) {
          textInput.value = "";
        }

        if (textResult) {
          textResult.textContent = "";
        }
      }
    );
  }


  /* =========================================
     3. TOOL SEARCH
  ========================================= */

  const search =
    document.getElementById("search");

  const toolGrid =
    document.getElementById("toolGrid");

  const searchMessage =
    document.getElementById("message");

  if (search && toolGrid) {

    const toolCards =
      Array.from(
        toolGrid.querySelectorAll(
          ".tool-card"
        )
      );

    search.addEventListener(
      "input",
      function () {

        const term =
          search.value
            .trim()
            .toLowerCase();

        let visibleCount = 0;

        toolCards.forEach(
          function (card) {

            const matches =
              card.textContent
                .toLowerCase()
                .includes(term);

            card.hidden = !matches;

            if (matches) {
              visibleCount++;
            }
          }
        );

        if (searchMessage) {

          searchMessage.textContent =
            term
              ? visibleCount +
                " tool(s) found."
              : "";
        }
      }
    );
  }


  /* =========================================
     4. QUIZ PRACTICE
  ========================================= */

  const quizQuestions = {

    daa: [
      {
        question:
          "Which technique divides a problem into smaller subproblems?",

        options: [
          "Greedy method",
          "Divide and conquer",
          "Brute force",
          "Backtracking"
        ],

        answer: 1
      },

      {
        question:
          "What is the average time complexity of merge sort?",

        options: [
          "O(n)",
          "O(n²)",
          "O(n log n)",
          "O(log n)"
        ],

        answer: 2
      },

      {
        question:
          "Which data structure is commonly used for BFS?",

        options: [
          "Stack",
          "Queue",
          "Heap",
          "Array only"
        ],

        answer: 1
      }
    ],

    cv: [
      {
        question:
          "What does CV stand for?",

        options: [
          "Computer Vision",
          "Central Variable",
          "Code Verification",
          "Computer Version"
        ],

        answer: 0
      },

      {
        question:
          "Which library is commonly used for image processing?",

        options: [
          "OpenCV",
          "NodeMailer",
          "Express",
          "SQLite"
        ],

        answer: 0
      },

      {
        question:
          "What is a pixel?",

        options: [
          "A programming language",
          "A smallest image element",
          "A database",
          "A network protocol"
        ],

        answer: 1
      }
    ],

    ml: [
      {
        question:
          "What does supervised learning use?",

        options: [
          "Only unlabeled data",
          "Labeled training data",
          "No data",
          "Only images"
        ],

        answer: 1
      },

      {
        question:
          "Which is a classification algorithm?",

        options: [
          "K-nearest neighbors",
          "Binary search",
          "Merge sort",
          "Dijkstra's algorithm"
        ],

        answer: 0
      },

      {
        question:
          "What is overfitting?",

        options: [
          "A model performs well on training data but poorly on new data",
          "A model has no parameters",
          "A model never trains",
          "A dataset has no labels"
        ],

        answer: 0
      }
    ],

    os: [
      {
        question:
          "Which component manages computer resources?",

        options: [
          "Text editor",
          "Operating system",
          "Web page",
          "Compiler only"
        ],

        answer: 1
      },

      {
        question:
          "Which scheduling algorithm uses a time quantum?",

        options: [
          "FCFS",
          "Round Robin",
          "SJF only",
          "FIFO page replacement"
        ],

        answer: 1
      },

      {
        question:
          "What is a process?",

        options: [
          "A program in execution",
          "A storage device",
          "A network cable",
          "A file extension"
        ],

        answer: 0
      }
    ],

    iwc: [
      {
        question:
          "What does IWC stand for?",

        options: [
          "Internet Web Code",
          "Introduction to Wireless Communication",
          "Integrated Wired Computing",
          "Internal Wi-Fi Control"
        ],

        answer: 1
      },

      {
        question:
          "Which technology enables wireless communication?",

        options: [
          "Radio waves",
          "Paper files",
          "Keyboard keys",
          "Printer ink"
        ],

        answer: 0
      },

      {
        question:
          "What does antenna gain describe?",

        options: [
          "Antenna's directional radiation performance",
          "Battery capacity",
          "Screen resolution",
          "File size"
        ],

        answer: 0
      }
    ]
  };


  const quizSubject =
    document.getElementById("quizSubject");

  const startQuizBtn =
    document.getElementById("startQuizBtn");

  const quizArea =
    document.getElementById("quizArea");

  const quizQuestion =
    document.getElementById("quizQuestion");

  const quizAnswers =
    document.getElementById("quizAnswers");

  const checkQuizBtn =
    document.getElementById("checkQuizBtn");

  const nextQuizBtn =
    document.getElementById("nextQuizBtn");

  const quizResult =
    document.getElementById("quizResult");

  const quizScore =
    document.getElementById("quizScore");

  let currentQuestions = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let answered = false;


  function displayQuizQuestion() {

    if (!quizQuestion || !quizAnswers) {
      return;
    }

    if (
      currentQuestionIndex >=
      currentQuestions.length
    ) {

      quizQuestion.textContent =
        "Quiz completed!";

      quizAnswers.replaceChildren();

      if (quizResult) {

        quizResult.textContent =
          "Final score: " +
          score +
          " out of " +
          currentQuestions.length;
      }

      if (quizScore) {

        quizScore.textContent =
          "Final score: " +
          score +
          " / " +
          currentQuestions.length;
      }

      if (checkQuizBtn) {
        checkQuizBtn.hidden = true;
      }

      if (nextQuizBtn) {
        nextQuizBtn.textContent =
          "Restart Quiz";
      }

      return;
    }

    answered = false;

    const item =
      currentQuestions[currentQuestionIndex];

    quizQuestion.textContent =
      (currentQuestionIndex + 1) +
      ". " +
      item.question;

    quizAnswers.replaceChildren();

    item.options.forEach(
      function (option, index) {

        const label =
          document.createElement("label");

        const radio =
          document.createElement("input");

        radio.type = "radio";
        radio.name = "quizAnswer";
        radio.value = String(index);

        label.appendChild(radio);

        label.appendChild(
          document.createTextNode(
            " " + option
          )
        );

        quizAnswers.appendChild(label);
      }
    );

    if (quizResult) {
      quizResult.textContent =
        "Choose an answer.";
    }

    if (quizScore) {

      quizScore.textContent =
        "Score: " +
        score +
        " / " +
        currentQuestions.length;
    }

    if (checkQuizBtn) {
      checkQuizBtn.hidden = false;
    }

    if (nextQuizBtn) {
      nextQuizBtn.textContent =
        "Next Question";
    }
  }


  if (startQuizBtn) {

    startQuizBtn.addEventListener(
      "click",
      function () {

        if (!quizSubject) return;

        currentQuestions =
          quizQuestions[quizSubject.value] ||
          [];

        currentQuestionIndex = 0;
        score = 0;
        answered = false;

        if (quizArea) {
          quizArea.hidden = false;
        }

        if (
          currentQuestions.length === 0
        ) {

          if (quizQuestion) {

            quizQuestion.textContent =
              "No questions available for this subject.";
          }

          if (quizAnswers) {
            quizAnswers.replaceChildren();
          }

          if (quizResult) {
            quizResult.textContent = "";
          }

          if (quizScore) {
            quizScore.textContent = "";
          }

          if (checkQuizBtn) {
            checkQuizBtn.hidden = true;
          }

          return;
        }

        displayQuizQuestion();
      }
    );
  }


  if (checkQuizBtn) {

    checkQuizBtn.addEventListener(
      "click",
      function () {

        if (answered) {

          if (quizResult) {

            quizResult.textContent =
              "You have already checked this answer.";
          }

          return;
        }

        if (
          !currentQuestions.length ||
          currentQuestionIndex >=
          currentQuestions.length
        ) {
          return;
        }

        const selected =
          quizAnswers
            ? quizAnswers.querySelector(
                'input[name="quizAnswer"]:checked'
              )
            : null;

        if (!selected) {

          if (quizResult) {

            quizResult.textContent =
              "Please choose an answer first.";
          }

          return;
        }

        answered = true;

        const item =
          currentQuestions[currentQuestionIndex];

        if (
          Number(selected.value) ===
          item.answer
        ) {

          score++;

          if (quizResult) {

            quizResult.textContent =
              "Correct! Well done.";
          }

        } else if (quizResult) {

          quizResult.textContent =
            "Incorrect. Correct answer: " +
            item.options[item.answer];
        }

        if (quizScore) {

          quizScore.textContent =
            "Score: " +
            score +
            " / " +
            currentQuestions.length;
        }

        if (quizAnswers) {

          quizAnswers
            .querySelectorAll("input")
            .forEach(
              function (radio) {
                radio.disabled = true;
              }
            );
        }
      }
    );
  }


  if (nextQuizBtn) {

    nextQuizBtn.addEventListener(
      "click",
      function () {

        if (!currentQuestions.length) {
          return;
        }

        if (
          currentQuestionIndex >=
          currentQuestions.length
        ) {

          currentQuestionIndex = 0;
          score = 0;

        } else {

          if (!answered) {

            if (quizResult) {

              quizResult.textContent =
                "Check your answer before continuing.";
            }

            return;
          }

          currentQuestionIndex++;
        }

        displayQuizQuestion();
      }
    );
  }


  /* =========================================
     5. SYLLABUS PDF SELECTOR
  ========================================= */

  // ONLY ONE syllabusFiles variable in this script
  const syllabusFiles = {

    all: {
      name: "all subjects.pdf",
      path: "syllabus_files/all subjects.pdf"
    },

    daa: {
      name: "Updated DAA Syllabus.pdf",
      path:
        "syllabus_files/Updated DAA Syllabus.pdf"
    },

    cv: {
      name: "Computer Vision Syllabus.pdf",
      path:
        "syllabus_files/CV-Syllabus.pdf"
    },

    ml: {
      name: "Machine Learning Syllabus.pdf",
      path:
        "syllabus_files/ML-Syllabus.pdf"
    },

    os: {
      name:
        "Operating Systems Syllabus.pdf",
      path:
        "syllabus_files/OS-Syllabus.pdf"
    },

    iwc: {
      name:
        "Introduction to Wireless Communication Syllabus.pdf",
      path:
        "syllabus_files/IWC-Syllabus.pdf"
    }
  };


  const syllabusSubject =
    document.getElementById(
      "syllabusSubject"
    );

  const syllabusResult =
    document.getElementById(
      "syllabusResult"
    );

  const syllabusTitle =
    document.getElementById(
      "syllabusTitle"
    );

  const syllabusMessage =
    document.getElementById(
      "syllabusMessage"
    );

  const openSyllabus =
    document.getElementById(
      "openSyllabus"
    );

  const downloadSyllabus =
    document.getElementById(
      "downloadSyllabus"
    );


  function updateSyllabus() {

    if (!syllabusSubject) return;

    const selected =
      syllabusFiles[
        syllabusSubject.value
      ];

    if (!selected) {

      if (syllabusResult) {
        syllabusResult.hidden = true;
      }

      if (openSyllabus) {

        openSyllabus.hidden = true;

        openSyllabus.removeAttribute(
          "href"
        );
      }

      if (downloadSyllabus) {

        downloadSyllabus.hidden = true;

        downloadSyllabus.removeAttribute(
          "href"
        );
      }

      if (syllabusTitle) {
        syllabusTitle.textContent = "";
      }

      if (syllabusMessage) {
        syllabusMessage.textContent = "";
      }

      return;
    }

    const fileUrl =
      selected.path
        .split("/")
        .map(
          (part) =>
            encodeURIComponent(part)
        )
        .join("/");

    if (syllabusResult) {
      syllabusResult.hidden = false;
    }

    if (syllabusTitle) {
      syllabusTitle.textContent =
        selected.name;
    }

    if (syllabusMessage) {

      syllabusMessage.textContent =
        "Your selected syllabus is ready to open or download.";
    }

    if (openSyllabus) {

      openSyllabus.href = fileUrl;

      openSyllabus.target = "_blank";

      openSyllabus.rel =
        "noopener noreferrer";

      openSyllabus.hidden = false;
    }

    if (downloadSyllabus) {

      downloadSyllabus.href = fileUrl;

      downloadSyllabus.setAttribute(
        "download",
        selected.name
      );

      downloadSyllabus.hidden = false;
    }
  }


  if (syllabusSubject) {

    syllabusSubject.addEventListener(
      "change",
      updateSyllabus
    );

    updateSyllabus();
  }


  /* =========================================
     6. TOOL NAVIGATION
  ========================================= */

  window.openTool = function (toolName) {

    const toolIds = [
      "calculatorTool",
      "studyTool",
      "syllabusTool",
      "quizTool",
      "textTool",
      "qbTool"
    ];

    toolIds.forEach(
      function (id) {

        const section =
          document.getElementById(id);

        if (section) {
          section.hidden = true;
        }
      }
    );

    const selectedTool =
      document.getElementById(
        toolName + "Tool"
      );

    if (!selectedTool) {

      console.error(
        "Tool section not found:",
        toolName + "Tool"
      );

      return;
    }

    selectedTool.hidden = false;

    selectedTool.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  };


  /* =========================================
     7. STUDY CORNER
  ========================================= */

  const studyResources = {

    daa: {
      title:
        "Design and Analysis of Algorithms",

      resources: [
        {
          name: "DAA Unit 1 Notes",
          url:
            "subject_files/DAA%20UNIT-1.pdf"
        },

        {
          name: "DAA Unit 2 Notes",
          url:
            "subject_files/DAA%20UNIT-2.pdf"
        },

        {
          name: "DAA Unit 3 Notes",
          url:
            "subject_files/DAA%20UNIT-3%20notes.pdf"
        },

        {
          name: "DAA Unit 4 Notes",
          url:
            "subject_files/DAA%20unit-4%20notes.pdf"
        }
      ]
    },

    cv: {
      title: "Computer Vision",

      resources: [
        {
          name:
            "OpenCV Learning Resources",

          url:
            "https://opencv.org/"
        }
      ]
    },

    ml: {
      title: "Machine Learning",

      resources: [
        {
          name:
            "Machine Learning Course",

          url:
            "https://www.coursera.org/learn/machine-learning"
        }
      ]
    },

    os: {
      title:
        "Operating Systems",

      resources: [
        {
          name:
            "Operating Systems: Three Easy Pieces",

          url:
            "https://pages.cs.wisc.edu/~remzi/OSTEP/"
        }
      ]
    },

    iwc: {
      title:
        "Introduction to Wireless Communication",

      resources: [
        {
          name:
            "3GPP Wireless Communication Resources",

          url:
            "https://www.3gpp.org/"
        }
      ]
    }
  };


  window.showSubject =
    function (subject) {

      const data =
        studyResources[subject];

      const title =
        document.getElementById(
          "resourcesTitle"
        );

      const list =
        document.getElementById(
          "resourcesList"
        );

      const container =
        document.getElementById(
          "subjectResources"
        );

      if (
        !data ||
        !title ||
        !list ||
        !container
      ) {

        console.error(
          "Study resource elements or subject data are missing."
        );

        return;
      }

      title.textContent =
        data.title;

      list.replaceChildren();

      data.resources.forEach(
        function (resource) {

          const item =
            document.createElement("li");

          const link =
            document.createElement("a");

          link.href =
            resource.url;

          link.textContent =
            resource.name;

          if (
            /^https:\/\//i.test(
              resource.url
            )
          ) {

            link.target = "_blank";

            link.rel =
              "noopener noreferrer";
          }

          item.appendChild(link);

          list.appendChild(item);
        }
      );

      container.hidden = false;

      container.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    };


  /* =========================================
     8. QUESTION BANK FILES
  ========================================= */

  const questionBankFiles = {

    all: [
      {
        name:
          "All Subjects Q.B.",

        path:
          "question%20bank/ALL%20SUBJECTS%20Q.B.pdf",

        type: "PDF"
      }
    ],

    daa: [
      {
        name:
          "DAA Q.B.docx",

        path:
          "question%20bank/DAA%20Q.B.docx",

        type:
          "Word document"
      }
    ],

    cv: [
      {
        name:
          "CV Q.B.docx",

        path:
          "question%20bank/CV%20Q.B.docx",

        type:
          "Word document"
      },

      {
        name:
          "QB.pdf(cv).pdf",

        path:
          "question%20bank/QB.pdf(cv).pdf",

        type: "PDF"
      }
    ],

    ml: [],

    os: [
      {
        name:
          "QB_OS.pdf",

        path:
          "question%20bank/QB_OS.pdf",

        type: "PDF"
      }
    ],

    iwc: [
      {
        name:
          "MDM Q.B.docx",

        path:
          "question%20bank/MDM%20Q.B.docx",

        type:
          "Word document"
      }
    ]
  };


  const subjectNames = {

    all: "All Subjects",

    daa: "DAA",

    cv: "Computer Vision",

    ml: "Machine Learning",

    os: "Operating Systems",

    iwc:
      "Introduction to Wireless Communication"
  };


  const qbSubject =
    document.getElementById(
      "qbSubject"
    );

  const qbSearch =
    document.getElementById(
      "qbSearch"
    );

  const qbQuestions =
    document.getElementById(
      "qbQuestions"
    );

  const qbCount =
    document.getElementById(
      "qbCount"
    );

  let mammothPromise = null;


  /* =========================================
     LOAD MAMMOTH FOR WORD FILES
  ========================================= */

  function loadMammoth() {

    if (window.mammoth) {
      return Promise.resolve(
        window.mammoth
      );
    }

    if (mammothPromise) {
      return mammothPromise;
    }

    mammothPromise =
      new Promise(
        function (resolve, reject) {

          const script =
            document.createElement(
              "script"
            );

          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js";

          script.onload =
            function () {

              if (window.mammoth) {

                resolve(
                  window.mammoth
                );

              } else {

                reject(
                  new Error(
                    "The document viewer library did not load."
                  )
                );
              }
            };

          script.onerror =
            function () {

              mammothPromise = null;

              reject(
                new Error(
                  "Could not load the document viewer. Check your internet connection."
                )
              );
            };

          document.head.appendChild(
            script
          );
        }
      );

    return mammothPromise;
  }


  function escapeHTML(value) {

    return String(value).replace(
      /[&<>"']/g,
      function (character) {

        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        }[character];
      }
    );
  }


  /* =========================================
     OPEN WORD DOCUMENT PREVIEW
  ========================================= */

  function openWordPreview(file) {

    const preview =
      window.open(
        "about:blank",
        "_blank"
      );

    if (!preview) {

      alert(
        "Allow pop-ups for UsefulHub, then try again."
      );

      return;
    }

    preview.document.open();

    preview.document.write(
      "<!DOCTYPE html>" +
      "<html>" +
      "<head>" +
      "<meta charset='UTF-8'>" +
      "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
      "<title>Opening document</title>" +
      "</head>" +
      "<body>" +
      "<p>Loading document...</p>" +
      "</body>" +
      "</html>"
    );

    preview.document.close();


    async function displayDocument() {

      try {

        const mammoth =
          await loadMammoth();

        const response =
          await fetch(
            new URL(
              file.path,
              window.location.href
            )
          );

        if (!response.ok) {

          throw new Error(
            "File not found (HTTP " +
            response.status +
            "). Check the file path and filename."
          );
        }

        const buffer =
          await response.arrayBuffer();

        const result =
          await mammoth.convertToHtml({
            arrayBuffer: buffer
          });

        preview.document.open();

        preview.document.write(
          "<!DOCTYPE html>" +
          "<html lang='en'>" +
          "<head>" +

          "<meta charset='UTF-8'>" +

          "<meta name='viewport' content='width=device-width, initial-scale=1'>" +

          "<title>" +
          escapeHTML(file.name) +
          "</title>" +

          "<style>" +

          "body{" +
          "max-width:850px;" +
          "margin:35px auto;" +
          "padding:20px;" +
          "font:16px/1.7 Arial,sans-serif;" +
          "color:#222" +
          "}" +

          "img{" +
          "max-width:100%;" +
          "height:auto" +
          "}" +

          "table{" +
          "border-collapse:collapse;" +
          "max-width:100%" +
          "}" +

          "td,th{" +
          "border:1px solid #aaa;" +
          "padding:6px" +
          "}" +

          "pre{" +
          "white-space:pre-wrap;" +
          "overflow-wrap:anywhere" +
          "}" +

          "@media(max-width:600px){" +
          "body{" +
          "margin:10px;" +
          "padding:12px" +
          "}" +
          "}" +

          "</style>" +

          "</head>" +

          "<body>" +

          "<h1>" +
          escapeHTML(file.name) +
          "</h1>" +

          result.value +

          "</body>" +

          "</html>"
        );

        preview.document.close();

        if (
          result.messages.length
        ) {

          console.warn(
            "Some Word formatting may not be preserved.",
            result.messages
          );
        }

      } catch (error) {

        if (!preview.closed) {

          preview.document.open();

          preview.document.write(
            "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "<meta charset='UTF-8'>" +
            "<title>Unable to open document</title>" +
            "</head>" +

            "<body>" +

            "<h2>Unable to open this document</h2>" +

            "<p>" +
            escapeHTML(
              error.message
            ) +
            "</p>" +

            "<p>" +
            "Check that the file exists at the configured path." +
            "</p>" +

            "</body>" +
            "</html>"
          );

          preview.document.close();
        }

        console.error(
          "Q.B. preview error:",
          error
        );
      }
    }

    displayDocument();
  }


  /* =========================================
     QUESTION BANK LINKS
  ========================================= */

  function configureQuestionBankOpenLink(
    link,
    file
  ) {

    link.textContent =
      "Open file";

    link.target = "_blank";

    link.rel =
      "noopener noreferrer";

    if (
      /\.docx$/i.test(file.name)
    ) {

      link.href = "#";

      link.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          openWordPreview(file);
        }
      );

    } else {

      link.href = file.path;
    }
  }


  function createQuestionBankCard(
    file,
    subject
  ) {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "file-card";

    const title =
      document.createElement(
        "h3"
      );

    title.textContent =
      file.name;

    const details =
      document.createElement(
        "p"
      );

    details.textContent =
      (
        subject
          ? subjectNames[subject] +
            " · "
          : ""
      ) +
      file.type;

    const actions =
      document.createElement(
        "div"
      );

    actions.className =
      "resource-actions";

    const openLink =
      document.createElement(
        "a"
      );

    configureQuestionBankOpenLink(
      openLink,
      file
    );

    const downloadLink =
      document.createElement(
        "a"
      );

    downloadLink.href =
      file.path;

    downloadLink.textContent =
      "Download";

    downloadLink.setAttribute(
      "download",
      file.name
    );

    actions.appendChild(openLink);

    actions.appendChild(
      downloadLink
    );

    card.appendChild(title);

    card.appendChild(details);

    card.appendChild(actions);

    return card;
  }


  function renderQuestionBank() {

    if (
      !qbSubject ||
      !qbSearch ||
      !qbQuestions ||
      !qbCount
    ) {
      return;
    }

    const selectedSubject =
      qbSubject.value;

    const searchText =
      qbSearch.value
        .trim()
        .toLowerCase();

    qbQuestions.replaceChildren();

    const files = [];

    Object.keys(
      questionBankFiles
    ).forEach(
      function (subject) {

        if (
          selectedSubject === "all"
        ) {

          questionBankFiles[
            subject
          ].forEach(
            function (file) {

              files.push({
                ...file,
                subject: subject
              });
            }
          );

        } else if (
          selectedSubject === subject
        ) {

          questionBankFiles[
            subject
          ].forEach(
            function (file) {

              files.push({
                ...file,
                subject: subject
              });
            }
          );
        }
      }
    );

    const filteredFiles =
      files.filter(
        function (file) {

          const subjectName =
            subjectNames[
              file.subject
            ] ||
            file.subject;

          return (
            file.name +
            " " +
            file.type +
            " " +
            subjectName
          )
            .toLowerCase()
            .includes(searchText);
        }
      );

    if (
      filteredFiles.length === 0
    ) {

      qbCount.textContent =
        "No question-bank files found.";

      const message =
        document.createElement(
          "p"
        );

      message.textContent =
        "No files match your selection. Try another subject or search term.";

      qbQuestions.appendChild(
        message
      );

      return;
    }

    qbCount.textContent =
      filteredFiles.length +
      " question-bank file(s) found.";

    filteredFiles.forEach(
      function (file) {

        qbQuestions.appendChild(
          createQuestionBankCard(
            file,
            file.subject
          )
        );
      }
    );
  }


  if (qbSubject) {

    qbSubject.addEventListener(
      "change",
      renderQuestionBank
    );
  }

  if (qbSearch) {

    qbSearch.addEventListener(
      "input",
      renderQuestionBank
    );
  }

  renderQuestionBank();


  /* =========================================
     9. Q.B. SUBJECT FILE SELECTOR
  ========================================= */

  const qbPaperSubject =
    document.getElementById(
      "qbPaperSubject"
    );

  const qbPaperList =
    document.getElementById(
      "qbPaperList"
    );


  function renderQuestionPapers() {

    if (
      !qbPaperSubject ||
      !qbPaperList
    ) {
      return;
    }

    qbPaperList.replaceChildren();

    const files =
      questionBankFiles[
        qbPaperSubject.value
      ] || [];

    if (files.length === 0) {

      const message =
        document.createElement(
          "p"
        );

      message.className =
        "no-resources";

      message.textContent =
        "No files are available for this subject yet.";

      qbPaperList.appendChild(
        message
      );

      return;
    }

    files.forEach(
      function (file) {

        qbPaperList.appendChild(
          createQuestionBankCard(
            file,
            qbPaperSubject.value
          )
        );
      }
    );
  }


  if (qbPaperSubject) {

    qbPaperSubject.addEventListener(
      "change",
      renderQuestionPapers
    );
  }

  renderQuestionPapers();


  /* =========================================
     10. INITIAL TOOL SETUP
  ========================================= */

  const toolSections = [
    "calculatorTool",
    "studyTool",
    "syllabusTool",
    "quizTool",
    "textTool",
    "qbTool"
  ];

  toolSections.forEach(
    function (id) {

      const section =
        document.getElementById(id);

      if (section) {
        section.hidden = true;
      }
    }
  );


  console.log(
    "UsefulHub JavaScript loaded successfully."
  );

});
