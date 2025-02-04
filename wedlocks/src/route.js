import nodemailer from 'nodemailer'
import templates from './templates'
import config from '../config'
import encrypter from './encrypter'
// This function loads the template and performs the actual email sending
// args: {
//  template: templateName string
//  failoverTemplate: failoverTemplate string
//  recipient: email address string
//  params: params for the template (as a hash). Each param is key: value where value can be either a string, or an object with {sign: <boolean></boolean>, value: <string>}
//  attachments: array of attachements as data-uri strings (nodemailer will handle them)
// }
export const route = async (args) => {
  let template = templates[args.template.toLowerCase()]

  if (!template && args.failoverTemplate) {
    template = templates[args.failoverTemplate.toLowerCase()]
  }

  if (!template) {
    throw new Error('Missing template')
  }

  const templateParams = {}
  Object.keys(args.params).forEach((key) => {
    const param = args.params[key]
    if (typeof param === 'object' && param.encrypt) {
      templateParams[key] = encrypter.signParam(param.value)
    } else {
      templateParams[key] = param
    }
  })

  const email = {
    from: config.sender,
    to: args.recipient,
    subject: template.subject(templateParams),
    text: template.text ? template.text(templateParams) : undefined,
    html: template.html ? template.html(templateParams) : undefined,
    attachments: []
      .concat(args.attachments, template.attachments)
      .filter((x) => !!x),
  }

  const transporter = nodemailer.createTransport(config)
  return transporter.sendMail(email)
}

export default {
  route,
}
