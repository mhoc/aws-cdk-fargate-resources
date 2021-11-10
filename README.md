# aws-cdk-fargate-resources

This is a small helper library for typescript aws-cdk projects which defines all of the resources
sizes for Fargate container instances, in a manner which can be typed checked statically at compile
time. It also provides some helper methods for dividing those resources between containers within
a task.

## Installation

```
$ npm i @mhoc/aws-cdk-fargate-resources
```

## Usage

In a construct:

```ts
import { FargateResources } from "@mhoc/aws-cdk-fargate-resources";

export interface {
  resources: FargateResources;
}

export class MyConstruct extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: MyConstructProps) {
    super(scope, id);
    const { resources } = props;

    // proportions can be calculated by simple percentages, like so.
    // this method always rounds the resulting values down to the nearest whole number.

    const taskDef1 = new ecs.TaskDefinition(this, "TaskDefinition", {
      cpu: resources.cpu.all,
      memory: resources.memory.all,
      containers: [
        // maybe the first container wants 90%
        { cpu: resources.cpu.take(0.9), memory: resources.memory.take(0.9), /* ... */ },
        // and the second container, 10%
        { cpu: resources.cpu.take(0.1), memory: reosurces.memory.take(0.1), /* ... */ },
        // if the number provided is 1 or above, its treated as an absolute value, not a proportion.
        // in other words, it just returns back the value you pass in. which isn't too valuable,
        // except, it will runtime error if you try to specify an absolute value more-than the 
        // total resources allocated; something the cdk will already do after the stack is submitted
        // to cloudformation, but at least this will do it before!
      ],
      // ...
    });

    // alternativesly, the 'pie' methods can be used, which is more stateful; like divying up a pie
    // to each container. this allows us to runtime-error not only if a single container asks for
    // more resources than are totally available, but if all the containers collectively ask for
    // more resources.

    const cpuPie = resources.cpu.pie();
    const memoryPie = resources.memory.pie();
    const taskDef2 = new ecs.TaskDefinition(this, "TaskDefinition", {
      cpu: resources.cpu.all,
      memory: resources.memory.all,
      containers: [
        // if the number is less-than 1, its treated as a proportion, just like the .take() method
        // above.
        { cpu: cpuPie.take(0.9), memory: memoryPie.take(0.9), /* ... */ },
        // if the number is above 1, its treated as an absolute value; the same units 
        // CloudFormation/cdk exepcts. mvCPU cores for CPU, and megabytes for memory.
        { cpu: cpuPie.take(100), memory: memoryPie.take(128), /* ... */ },
        // the unique quality of the pie methods is, if you try to take too much, they'll runtime
        // error, before the stack is even submitted to cloudformation; fail fast!
        { cpu: cpuPie.take(0.7), memory: memoryPie.take(0.2), /* ... */ },
        // Runtime Error: not enough pie!
        // a .rest() method is also available, to simply give the final container in your list 
        // whatever resources are left over. if you're using proportions, sometimes the rounding can
        // cause 1 or 2 resource units to be "left behind", even if your proportions add up to 1;
        // this ensures every last drop of resources is used!
        { cpu: cpuPie.rest(), memory: memoryPie.rest(), /* ... */ },
        // .rest() does not error if the remaining pie is 0; so, you can compose these methods to
        // ensure the final container always gets at-least a certain amount of resources, plus
        // whatever is left over.
        { cpu: cpuPie.take(100) + cpuPie.rest(), memory: memoryPie.take(256) + memoryPie.rest() }
      ],
      // ...
    });
  }
}
```

And instantiating that construct:

```ts
import { FargateResources } from "@mhoc/aws-cdk-fargate-resources";

const new MyConstruct(app, "MyConstruct", {
  // the best way to instantiate it: statically. this library exports static readonly members for 
  // every valid fargate configuration AWS offers. at least, since the last time the library was
  // published :)
  resources: FargateResources.cpu500m.mem2g,
  // alternatively, you can fall back to the constructor
  resources: new FargateResources(500, 2048),
});
```
