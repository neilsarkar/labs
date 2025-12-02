export {};

await two();

async function one() {
  const file = await Bun.file("data/1.txt").text();

  const lines = file.split("\n");

  let dial = 50;

  let zeroCount = 0;
  for (const line of lines) {
    const dir = line[0] === "L" ? -1 : 1;
    const num = parseInt(line.slice(1), 10);
    for (let i = 0; i < num; i++) {
      dial += dir;
      if (dial < 0) {
        dial = 99;
      }
      if (dial > 99) {
        dial = 0;
      }
      if (dial === 0) {
        zeroCount++;
      }
    }

    console.log(line, dial, zeroCount);
  }

  console.log({ zeroCount });
}

async function two() {
  const file = await Bun.file("data/2.txt").text();
  const ranges = file.split(",").map((s) => s.trim());
  const badIds = new Set<number>();

  for (const range of ranges) {
    const [startStr, endStr] = range.split("-").map((s) => s.trim());
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);

    for (let id = start; id <= end; id++) {
      if (isBadId(id)) {
        console.log(id);
        badIds.add(id);
      }
    }
  }

  let sum = 0;
  for (const id of badIds) {
    sum += id;
  }
  console.log({ sum });
}

function isBadId(id: number): boolean {
  const idStr = id.toString();
  for (let i = 0; i < Math.floor(idStr.length / 2); i++) {
    const pattern = idStr.slice(0, i + 1);
    if (idStr.match(new RegExp(`^(${pattern})+$`))) {
      return true;
    }
  }

  return false;
}
