export class FargateResources {
  public static readonly cpu250m = {
    mem512m: new FargateResources(250, 512),
    mem1g: new FargateResources(250, 1024),
    mem2g: new FargateResources(250, 2048),
  };
  public static readonly cpu500m = {
    mem1g: new FargateResources(500, 1024),
    mem2g: new FargateResources(500, 2048),
    mem3g: new FargateResources(500, 3072),
    mem4g: new FargateResources(500, 4096),
  };
  public static readonly cpu1 = {
    mem2g: new FargateResources(1000, 2048),
    mem3g: new FargateResources(1000, 3072),
    mem4g: new FargateResources(1000, 4096),
    mem5g: new FargateResources(1000, 5120),
    mem6g: new FargateResources(1000, 6144),
    mem7g: new FargateResources(1000, 7168),
    mem8g: new FargateResources(1000, 8192),
  };
  public static readonly cpu2 = {
    mem4g: new FargateResources(2000, 4096),
    mem5g: new FargateResources(2000, 5120),
    mem6g: new FargateResources(2000, 6144),
    mem7g: new FargateResources(2000, 7168),
    mem8g: new FargateResources(2000, 8192),
    mem9g: new FargateResources(2000, 9216),
    mem10g: new FargateResources(2000, 10240),
    mem11g: new FargateResources(2000, 11264),
    mem12g: new FargateResources(2000, 12288),
    mem13g: new FargateResources(2000, 13312),
    mem14g: new FargateResources(2000, 14336),
    mem15g: new FargateResources(2000, 15360),
    mem16g: new FargateResources(2000, 16384),
  };
  public static readonly cpu4 = {
    mem8g: new FargateResources(4000, 8192),
    mem9g: new FargateResources(4000, 9216),
    mem10g: new FargateResources(4000, 10240),
    mem11g: new FargateResources(4000, 11264),
    mem12g: new FargateResources(4000, 12288),
    mem13g: new FargateResources(4000, 13312),
    mem14g: new FargateResources(4000, 14336),
    mem15g: new FargateResources(4000, 15360),
    mem16g: new FargateResources(4000, 16384),
    mem17g: new FargateResources(4000, 17408),
    mem18g: new FargateResources(4000, 18432),
    mem19g: new FargateResources(4000, 19456),
    mem20g: new FargateResources(4000, 20480),
    mem21g: new FargateResources(4000, 21504),
    mem22g: new FargateResources(4000, 22528),
    mem23g: new FargateResources(4000, 23552),
    mem24g: new FargateResources(4000, 24576),
    mem25g: new FargateResources(4000, 25600),
    mem26g: new FargateResources(4000, 26624),
    mem27g: new FargateResources(4000, 27648),
    mem28g: new FargateResources(4000, 28672),
    mem29g: new FargateResources(4000, 29696),
    mem30g: new FargateResources(4000, 30720),
  };

  public readonly cpu = {
    all: -1,
    take: (n: number): number => {
      if (n < 1) {
        return Math.floor(this.cpu.all * n);
      }
      n = Math.floor(n);
      if (n > this.cpu.all) {
        throw new Error(`Requested cpu value ${n} exceeds total cpu available (${this.cpu.all}).`);
      }
      return n;
    },
    pie: (): FargateResourcePie => new FargateResourcePie("cpu", this.cpu.all),
  };

  public readonly memory = {
    all: -1,
    take: (n: number): number => {
      if (n < 1) {
        return Math.floor(this.memory.all * n);
      }
      n = Math.floor(n);
      if (n > this.memory.all) {
        throw new Error(`Requested memory value ${n} exceeds total memory available (${this.cpu.all}).`);
      }
      return n;
    },
    pie: (): FargateResourcePie => new FargateResourcePie("memory", this.memory.all),
  };

  constructor(cpuRaw: number, memoryRaw: number) {
    if (cpuRaw <= 0) {
      throw new Error("FargateResources instantiated with negative cpu value");
    }
    if (memoryRaw <= 0) {
      throw new Error("FargateResources instantiated with negative memory value");
    }
    this.cpu.all = cpuRaw;
    this.memory.all = memoryRaw;
  }

}

export class FargateResourcePie {
  private remaining: number;

  constructor(
    private readonly label: string, 
    private readonly total: number,
  ) {
    if (total < 0) {
      throw new Error("FargateResourcePie instantiated with negative value");
    }
    this.remaining = total;
  }

  public rest(): number {
    const _remaining = this.remaining;
    this.remaining = 0;
    return _remaining;
  }

  public take(n: number): number {
    if (n < 1) {
      const desired = Math.floor(this.total * n);
      if (desired > this.remaining) {
        throw new Error(`Requested ${this.label} proportion ${n} exceeds remaining ${this.label} available (${desired} > ${this.remaining}).`);
      }
      this.remaining -= desired;
      return desired;
    }
    n = Math.floor(n);
    if (n > this.remaining) {
      throw new Error(`Requested ${this.label} value ${n} exceeds remaining ${this.label} available (${this.remaining}).`);
    }
    this.remaining -= n;
    return n;
  }

}
