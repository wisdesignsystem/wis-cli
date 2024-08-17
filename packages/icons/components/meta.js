export default [
  {
    type: 'outline',
    title: 'Outline',
    children: [
      {
        type: 'class',
        title: 'Class',
        children: [
          { type: 'component', name: 'CircleSucceed' },
          { type: 'component', name: 'WorkingOdd' },
        ],
      },
    ],
  },
  {
    type: 'solid',
    title: 'Solid',
    children: [{ type: 'class', title: 'Class', children: [{ type: 'component', name: 'CircleSucceedFilled' }] }],
  },
]
