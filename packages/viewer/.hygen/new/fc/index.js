//
// pnpm new:fc -- --tag=p
//
module.exports = {
  prompt: ({ inquirer, args }) => {
    const questions = [
      {
        type: 'input',
        name: 'feature',
        message: 'What is the name of feature? (blank for common component)'
      },
      {
        type: 'input',
        name: 'component_name',
        message: 'What is the name of component?'
      },
      {
        type: 'input',
        name: 'dir',
        message: 'Where is the directory? (No problem in blank)'
      },
      {
        type: 'confirm',
        name: 'have_style',
        message: 'Is it have style?'
      },
      {
        type: 'confirm',
        name: 'have_children',
        message: 'Is it have children?'
      },
      {
        type: 'confirm',
        name: 'have_mock',
        message: 'Do you want to make tRPC mock?'
      }
    ]
    return inquirer.prompt(questions).then((answers) => {
      const { feature, component_name, dir } = answers
      const componentDir = feature ? `features/${feature}/components` : 'components'
      const path = `${componentDir}/${dir ? `${dir}/` : ``}${component_name}`
      const abs_path = `src/renderer/src/${path}`
      const tag = args.tag ? args.tag : 'div'
      return { ...answers, path, abs_path, tag }
    })
  }
}
