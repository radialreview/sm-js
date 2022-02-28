# sm-js

## Introduction

sm-js is the Javascript SDK that comes with the SaaS Master backend-as-a-service. Using this library is not a requirement.\
SaaS Master exposes a very simple GraphQL API that can be operated by any programming language and simple web requests.

## SM Core Concepts

### Nodes and Edges

In SM, there are two primary data structures, nodes and edges.

SM does not operate like most databases. Objects are not rows in tables, objects are standalone entities in a graph.\
As a developer building with SM, simply know that a node contains schema-less json data.\
In other words, just because you create two objects of the same type, they are not inherently related.\
The two objects exist completely independent of each other, there is no shared table.

Edges are the other primary data structure in SM.\
The purpose of the edge is to relate two nodes with each other.\
While you can store schema-less data on an edge, their main purpose is to facilitate permissions.

### Edge Permissions

Permissions are a primary concern in SM, not just an after thought.\
Instead of maintaining access control lists or roles, SM stores the permissions of every node on edges.\
With the exception of a terminating permission, permissions are generally cascading.\
That means if Node A has permission to view Node B and Node B has permission to view Node C, then Node A has permission to view Node C.

#### View Permission

This is the most basic permission. Having the permission to view a node allows you to read the data on it.

#### Edit Permission

The edit permission allows you to edit the properties on a node.

#### Manage Permission

The manage permission allows you to grant other nodes permission to the node being managed.

#### Add Child Permission

Note: Should we rename this to "append"?
The add child permission allows you to grant the node that you have "add child" permission to permission to other nodes.

## Getting started with sm-js SDK

### Hello World!

Below is the most concise example of writing data to SM.

```TS
smJS.transaction(ctx => {
    ctx.createNode({
        data: {
            type: 'car',
            make: 'Jeep',
            model: 'Grand Cherokee',
            color: 'Gray',
            year: 2001
        },
    });
}).execute();
```

and if you want to get that data back out

```TS
const { data } = useSubscription({
    cars: queryDefinition({
      type: 'car',
      map: userData => ({
        id: 'id',
        make: 'make',
        model: 'model',
        year: 'year',
        }),
      }),
    });
```

not only does that give you all of our data back, it also creates an observable object that is updated in real-time using web sockets behind the scenes.

While this makes getting up and running with SM quick, any meaningful project will want type definitions, type safety, etc.\
This kind of functionality is also supported by our library.

### Defining your nodes

```TS
const todoProperties = {
  id: string,
  task: string,
  assigneeId: string.optional,
};

export const todoNode: TodoNode = smJS.def({
  type: 'todo',
  properties: todoProperties,
  relational: {
    assignee: () =>
      reference<TodoNode, UserNode>({
        def: userNode,
        idProp: 'assigneeId',
      }),
  },
});

const userProperties = {
  id: string,
  firstName: string,
  lastName: string,
  address: string,
};

export const userNode: UserNode = smJS.def({
  type: 'demo-user',
  properties: userProperties,
  relational: {
    todos: () => relational({ def: todoNode, name: 'assigned' }),
  },
});
```

TODO: Explain the above code.

### Writing Data to SM

```TS
  const createUser = async (opts: {
    firstName: string;
    lastName: string;
    address: string;
  }) => {
    return smJS
      .transaction(ctx => {
        ctx.createNode({
          data: {
            type: userNode.type,
            firstName: opts.firstName,
            lastName: opts.lastName,
            address: opts.address,
          },
        });
      })
      .execute();
  };

  const createTodo = async (opts: { task: string; assigneeId?: string }) => {
    const createNodeData: NodeData = {
      type: todoNode.type,
      task: opts.task,
    };

    if (opts.assigneeId) {
      createNodeData.assigneeId = opts.assigneeId;
      createNodeData.additionalEdges = [
        {
          from: opts.assigneeId,
          view: true,
          edit: true,
          manage: true,
        },
      ];
    }

    return smJS
      .transaction(ctx => {
        ctx.createNode({ data: createNodeData });
      })
      .execute();
  };
```

TODO: Explain

### Querying Realtime Data

```TS
  const { data } = useSubscription({
    users: queryDefinition({
      def: userNode,
      map: userData => ({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        address: userData.address,
        todos: userData.todos({
          map: todoData => ({
            id: todoData.id,
            task: todoData.task,
          }),
        }),
      }),
    }),
  });
```
