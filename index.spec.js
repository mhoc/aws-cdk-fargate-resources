const assert = require("assert");
const { FargateResources, FargateResourcePie } = require("./index");

describe("FargateResources", function() {
  describe("static", function() {
    it("static members should return reasonable values", function() {
      const r = FargateResources.cpu1.mem4g;
      assert.equal(r.cpu.all, 1000);
      assert.equal(r.memory.all, 4096);
    });
  });
  describe("new", function() {
    it("should instantiate without error with reasonable values", function() {
      new FargateResources(500, 256);
    });
    it("should error if unreasonable values are provided", function() {
      assert.throws(() => new FargateResources(-1, 200), "expected negative cpu resource to throw");
      assert.throws(() => new FargateResources(200, -1), "expected negative memory resource to throw");
      assert.throws(() => new FargateResources(-1, -1), "expected negative cpu & memory resource to throw");
    });
  });
  describe("#take", function() {
    it("should return the provided absolute value", function() {
      const r = FargateResources.cpu1.mem4g;
      assert.equal(r.cpu.take(200), 200);
      assert.equal(r.memory.take(512), 512);
    });
    it("should round down an absolute value if not whole", function() {
      const r = FargateResources.cpu500m.mem4g;
      assert.equal(r.cpu.take(250.2), 250);
      assert.equal(r.memory.take(1234.5), 1234);
    });
    it("should error on absolute values which are too large", function() {
      const r = FargateResources.cpu1.mem4g;
      assert.throws(() => r.cpu.take(1500));
      assert.throws(() => r.memory.take(8192));
    });
    it("should return a valid, whole proportional value", function() {
      const r = FargateResources.cpu2.mem8g;
      assert.equal(r.cpu.take(0.5), 1000);
      assert.equal(r.memory.take(0.25), 2048);
    });
    it("should return a rounded-down whole number when provided a non-whole proportional number", function() {
      const r = FargateResources.cpu500m.mem1g;
      assert.equal(r.cpu.take(0.833), 416);
      assert.equal(r.memory.take(0.22), 225);
    });
  });
  describe("#pie", function() {
    it("should return a pie without error", function() {
      FargateResources.cpu500m.mem2g.cpu.pie();
      FargateResources.cpu250m.mem512m.memory.pie();
    });
  });
});

describe("FargateResourcePie", function() {
  describe("new", function() {
    it("should instantiate a pie without error", function() {
      new FargateResourcePie("cpu", 1024);
    });
    it("should error when a pie is instantiated with unreasonable, negative values", function() {
      assert.throws(() => new FargateResourcePie("cpu", -2));
    });
  });
  describe("#take", function() {
    it("should return the provided absolute value", function() {
      const r = FargateResources.cpu1.mem4g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.take(200), 200);
      assert.equal(memPie.take(512), 512);
    });
    it("should round down an absolute value if not whole", function() {
      const r = FargateResources.cpu500m.mem4g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.take(250.2), 250);
      assert.equal(memPie.take(1234.5), 1234);
    });
    it("should error on absolute values which are too large", function() {
      const r = FargateResources.cpu1.mem4g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.throws(() => cpuPie.take(1500));
      assert.throws(() => memPie.take(8192));
    });
    it("should return a valid, whole proportional value", function() {
      const r = FargateResources.cpu2.mem8g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.take(0.5), 1000);
      assert.equal(memPie.take(0.25), 2048);
    });
    it("should return a rounded-down whole number when provided a non-whole proportional number", function() {
      const r = FargateResources.cpu500m.mem1g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.take(0.833), 416);
      assert.equal(memPie.take(0.22), 225);
    });
    it("should throw an error when too much of the pie is taken absolutely", function() {
      const r = FargateResources.cpu500m.mem1g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      cpuPie.take(450);
      memPie.take(900);
      assert.throws(() => cpuPie.take(500));
      assert.throws(() => memPie.take(500));
    });
    it("should throw an error when too much of the pie is taken proportionally", function() {
      const r = FargateResources.cpu2.mem5g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      cpuPie.take(0.9);
      memPie.take(0.7);
      assert.throws(() => cpuPie.take(0.4));
      assert.throws(() => memPie.take(0.8));
    });
    it("should throw an error when too much of the pie is taken both absolutely and proportionally", function() {
      const r = FargateResources.cpu2.mem5g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.take(1900), 1900);
      assert.equal(memPie.take(4000), 4000);
      assert.throws(() => cpuPie.take(0.4));
      assert.throws(() => memPie.take(0.8));
    });
    it("should isolate the state of two independently instantiated pies from the same resources", function() {
      const r = FargateResources.cpu250m.mem2g;
      const cpuPie1 = r.cpu.pie();
      const cpuPie2 = r.cpu.pie();
      const memPie1 = r.memory.pie();
      const memPie2 = r.memory.pie();
      assert.equal(cpuPie1.take(200), 200);
      assert.equal(cpuPie2.take(200), 200);
      assert.equal(memPie1.take(1500), 1500);
      assert.equal(memPie2.take(1500), 1500);
    });
  });
  describe("#rest", function() {
    it("should return the whole pie if called on a new pie", function() {
      const r = FargateResources.cpu2.mem9g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.rest(), 2000);
      assert.equal(memPie.rest(), 9216);
    });
    it("should return no remaining resources, without error, on an empty pie", function() {
      const r = FargateResources.cpu500m.mem3g;
      const cpuPie = r.cpu.pie();
      const memPie = r.memory.pie();
      assert.equal(cpuPie.rest(), 500);
      assert.equal(cpuPie.rest(), 0);
      assert.equal(cpuPie.rest(), 0);
      assert.equal(memPie.rest(), 3072);
      assert.equal(memPie.rest(), 0);
      assert.equal(memPie.rest(), 0);
    });
  });
});