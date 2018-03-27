# Example Machine Activation
This is an example of a typical machine activation flow. You may of course
choose to implement a different flow if required - this only serves as an
example implementation.

## Running the example

First up, configure a few environment variables:
```bash
# Keygen product token (don't share this!)
export KEYGEN_PRODUCT_TOKEN="YOUR_KEYGEN_PRODUCT_TOKEN"

# Your Keygen account ID
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):
```
yarn
```

## Configuring a license policy

Visit [your dashboard](https://app.keygen.sh/policies) and create a new
policy with the following attributes:

```javascript
{
  requireFingerprintScope: true,
  maxMachines: 1,
  concurrent: false,
  floating: false,
  strict: true
}
```

## Activating a machine

Run the script and supply a valid license key and an arbitrary machine
fingerprint to perform an activation:
```
yarn start test-key test:fingerprint
```

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
