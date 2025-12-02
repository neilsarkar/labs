export {};

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
