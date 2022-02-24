# sm-js

## Introduction

sm-js is the Javascript SDK that comes with the SaaS Master backend-as-a-service. Using this library is not a requirement.\
SaaS Master exposes a very simple GraphQL API that can be operated by any programming language and simple web requests.

## SM Core Concepts

### Nodes and Edges

In SM, there are two primary data structures, nodes and edges.

SM does not operate like most databases. Objects are not rows in tables, objects are standalone entities in a graph.\
As a developer building with SM, you're not required to concern yourself with the intricacies of this concept.\
The main take away is that just because you create two objects of the same type, they are not inherently related.\
The two objects exist completely independent of each other, there is no shared table.

Edges are the other primary data structure in SM. Edges are very similar to nodes in that they can store arbitrary data.\
However, the purpose of the edge is to relate two nodes with each other.\
In addition to data you as a developer want to include on the edge (such as naming the relationship)\
every edge contains permission data.

### Edge Permissions

Permissions are a primary concern in SM, not just an after thought.\
Instead of maintaining access control lists or roles, SM stores the permissions of every node on edges.\
With the exception of a terminating permission, permissions are generally transitive.\
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

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
