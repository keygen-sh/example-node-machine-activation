const {
  KEYGEN_PRODUCT_TOKEN,
  KEYGEN_ACCOUNT_ID
} = process.env

const fetch = require('node-fetch')
const chalk = require('chalk')

async function activateLicense(key, fingerprint) {
  // Validate the license key before activation, so we can be sure it supports
  // another machine. Notice that this validation is scoped to the current
  // machine via its fingerprint - this ensures that license activation is
  // not performed for machines that are already activated.
  const validation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      meta: {
        scope: { fingerprint },
        key
      }
    })
  })

  const { meta, data: license } = await validation.json()

  // If the license is valid, that means the current machine is already
  // activated. We can safely return.
  if (meta.valid) {
    return null
  }

  // If we've gotten this far, our license is not valid for the current
  // machine and we should attempt to activate it.
  switch (meta.constant) {
    // This means the license already has at least 1 machine associated with
    // it, but none match the current machine's fingerprint. We're breaking
    // on this case because, for this example, we want to support activating
    // more than 1 machine.
    case 'FINGERPRINT_SCOPE_MISMATCH':
    // You will receive a NO_MACHINES status when the license IS floating,
    // and when it does not currently have any associated machines.
    case 'NO_MACHINES':
    // You will receive a NO_MACHINE status when the license IS NOT floating
    // i.e. it's node-locked, and when it does not currently have any
    // associated machines.
    case 'NO_MACHINE': {
      break
    }
    default: {
      throw new Error(`Activation failed: license ${meta.detail} (${meta.constant})`)
    }
  }

  // Attempt to activate the current machine for the license, using the
  // license ID that we received from the validation response and the
  // current machine's fingerprint.
  const activation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYGEN_PRODUCT_TOKEN}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    },
    body: JSON.stringify({
      data: {
        type: 'machines',
        attributes: {
          fingerprint
        },
        relationships: {
          license: {
            data: { type: 'licenses', id: license.id }
          }
        }
      }
    })
  })

  const { data: machine, errors } = await activation.json()
  if (errors) {
    throw new Error(JSON.stringify(errors, null, 2))
  }

  // All is good - the machine was successfully activated.
  return machine
}

async function main() {
  const key = process.argv[2]
  const fingerprint = process.argv[3]

  try {
    const machine = await activateLicense(key, fingerprint)
    if (machine == null) {
      console.log(
        chalk.yellow('The current machine has already been activated!')
      )

      return
    }

    console.log(
      chalk.green(`The current machine was successfully activated!\n${JSON.stringify(machine, null, 2)}`),
    )
  } catch(err) {
    console.error(
      chalk.red(`Activation error!\n${err.message}`)
    )
  }
}

main()