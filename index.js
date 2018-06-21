const {
  MACHINE_STORAGE_PATH = 'machine.json',
  KEYGEN_ACTIVATION_TOKEN,
  KEYGEN_ACCOUNT_ID
} = process.env

const fetch = require('node-fetch')
const readline = require('readline')
const chalk = require('chalk')
const fs = require('fs')

const rl = readline.createInterface(
  process.stdin,
  process.stdout
)

const prompt = msg =>
  new Promise(resolve => rl.question(chalk.cyan(`${msg}: `), a => resolve(a)))

async function setMachineCache(machine) {
  try {
    fs.writeFileSync(MACHINE_STORAGE_PATH, JSON.stringify(machine))

    return machine
  } catch (e) {}
}

async function getMachineCache() {
  try {
    const machine = fs.readFileSync(MACHINE_STORAGE_PATH)

    return JSON.parse(machine)
  } catch (e) {}
}

async function delMachineCache() {
  try {
    fs.unlinkSync(MACHINE_STORAGE_PATH)
  } catch (e) {}
}

async function activateMachine(key, fingerprint) {
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
    const machine = await getMachineCache()

    return {
      activated: false,
      machine
    }
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
    // and it does not currently have any associated machines.
    case 'NO_MACHINES':
    // You will receive a NO_MACHINE status when the license IS NOT floating
    // i.e. it's node-locked, and it does not currently have any
    // associated machines.
    case 'NO_MACHINE': {
      break
    }
    default: {
      throw new Error(`license ${meta.detail} (${meta.constant})`)
    }
  }

  // Attempt to activate the current machine for the license, using the
  // license ID that we received from the validation response and the
  // current machine's fingerprint.
  const activation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${KEYGEN_ACTIVATION_TOKEN}`,
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

  // We're caching the activation response locally so that we can perform
  // a machine deactivation without hitting the network to query for the
  // current machine's ID (which is different from its fingerprint).
  await setMachineCache(machine)

  // All is good - the machine was successfully activated.
  return {
    activated: true,
    machine,
  }
}

async function deactivateMachine(machine) {
  const deactivation = await fetch(`https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines/${machine.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${KEYGEN_ACTIVATION_TOKEN}`,
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    }
  })

  if (deactivation.status === 204) {
    delMachineCache()

    return
  }

  const { errors } = await deactivation.json()
  if (errors) {
    throw new Error(JSON.stringify(errors, null, 2))
  }
}

async function main() {
  const key = await prompt('Enter a license key')
  const fingerprint = await prompt('Enter a machine fingerprint')

  try {
    const { machine, activated } = await activateMachine(key, fingerprint)
    if (activated) {
      console.log(
        chalk.green(`The machine was successfully activated (${machine.id})`)
      )
    } else if (machine) {
      console.log(
        chalk.yellow(`The machine has already been activated (${machine.id})`)
      )

      const deactivate = await prompt('Do you want to deactivate this machine? [y/N]')
      if (`${deactivate}`.toLowerCase() === 'y') {
        await deactivateMachine(machine)

        console.log(
          chalk.green(`The machine was successfully deactivated (${machine.id})`)
        )
      }
    } else {
      console.log(
        chalk.yellow(`The machine has already been activated, but a cached copy of it's data could not be found. Maybe it was activated on another device or through the dashboard UI?`)
      )
    }

    process.exit(0)
  } catch(err) {
    console.error(
      chalk.red(`An error has occurred:\n${err.message}`)
    )

    process.exit(1)
  }
}

main()