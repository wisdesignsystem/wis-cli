// @ts-nocheck

function loaderTable(source, ...rest) {
  const { swc } = this._compiler.rspack.experiments

  // const ast = swc.parseSync(`
  //   <Cell>
  //     {{cellData.data}}
  //   </Cell>  
  // `);

  console.log(...rest)
  process.exit();

  return source;
}

export default loaderTable;
