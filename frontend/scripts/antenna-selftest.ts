/* Unit test for pure antenna calc logic. Run via tsx / ts-node. */
import { computeLength, resonantBands } from "../src/antenna/antenna";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra?: string) {
  if (cond) {
    pass++;
    console.log("PASS:", name);
  } else {
    fail++;
    console.log("FAIL:", name, extra ?? "");
  }
}
function near(a: number, b: number, eps = 0.01) {
  return Math.abs(a - b) <= eps;
}

// --- Forward: length ---
check("λ/4 coeff ~71.25", near(computeLength(1, "1/4", null, 0.95)!, 71.25));
check("λ/2 coeff ~142.5", near(computeLength(1, "1/2", null, 0.95)!, 142.5));
check("5/8 coeff ~178.13", near(computeLength(1, "5/8", null, 0.95)!, 178.125));
check("1λ stretched ~285.0", near(computeLength(1, "1/1", "stretched", 0.95)!, 285.0));
check("1λ loop fixed 306.3", near(computeLength(1, "1/1", "loop", 0.95)!, 306.3));
check("loop ignores VF", computeLength(1, "1/1", "loop", 0.8) === computeLength(1, "1/1", "loop", 0.99));
check("λ/2 @14.2 ~10.04m", near(computeLength(14.2, "1/2", null, 0.95)!, 10.035, 0.01));
check("invalid freq -> null", computeLength(0, "1/2", null, 0.95) === null);

// --- Reverse: bands + antenna forms ---
// User example: 6.60 m is 5/8 λ for ~26.99 MHz -> 11 m CB band.
const b660 = resonantBands(6.6, 0.95);
check("6.60m -> 11m CB present", b660.some((h) => h.band === "11 m (CB)"), b660.map((h) => h.band).join(","));
check("6.60m -> 11m CB is 5/8 λ", b660.some((h) => h.band === "11 m (CB)" && h.form === "5/8 λ"), b660.map((h) => `${h.band}:${h.form}`).join(","));

// 20.07 m: λ/4 -> 80 m, λ/2 -> 40 m, 1 λ -> 20 m, plus 15 m & 10 m harmonics.
const b2007 = resonantBands(20.07, 0.95);
const names2007 = b2007.map((h) => h.band);
check("20.07m -> 80m via λ/4", b2007.some((h) => h.band === "80 m" && h.form === "λ/4"), names2007.join(","));
check("20.07m -> 40m via λ/2", b2007.some((h) => h.band === "40 m" && h.form === "λ/2"));
check("20.07m -> 20m via 1 λ", b2007.some((h) => h.band === "20 m" && h.form === "1 λ"));
check("20.07m -> 15m", names2007.includes("15 m"), names2007.join(","));
check("20.07m -> 10m", names2007.includes("10 m"), names2007.join(","));
const sortedAsc = b2007.every((h, i) => i === 0 || b2007[i - 1].freqMHz <= h.freqMHz);
check("hits sorted by frequency asc", sortedAsc);

// 10.03 m half-wave for 20 m: also λ/4 -> 40 m and 1 λ -> 10 m.
const b1003 = resonantBands(10.03, 0.95);
const names1003 = b1003.map((h) => h.band);
check("10.03m -> 20m present", names1003.includes("20 m"), names1003.join(","));
check("10.03m -> 10m present", names1003.includes("10 m"), names1003.join(","));

check("empty length -> []", resonantBands(0, 0.95).length === 0);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
