# Example Machine Activation

This is an example of a typical machine activation flow. You may of course
choose to implement a different flow if required - this only serves as an
example implementation.

## Running the example

First up, configure a few environment variables:

```bash
# Your Keygen account ID. Find yours at https://app.keygen.sh/settings.
export KEYGEN_ACCOUNT_ID="YOUR_KEYGEN_ACCOUNT_ID"
```

You can either run each line above within your terminal session before
starting the app, or you can add the above contents to your `~/.bashrc`
file and then run `source ~/.bashrc` after saving the file.

Next, install dependencies with [`yarn`](https://yarnpkg.comg):

```bash
yarn
```

## Activating/deactivating a machine

To perform a machine activation or a deactivation, run the script and
supply a valid license key and an arbitrary machine fingerprint when
prompted:

```bash
yarn start
```

If the current machine has already been activated, you will be prompted
to deactivate it.

To use `demo` credentials, you can run the following:

```bash
KEYGEN_ACCOUNT_ID=demo yarn start
```

Enter `C1B6DE-39A6E3-DE1529-8559A0-4AF593-V3` when prompted.

## Questions?

Reach out at [support@keygen.sh](mailto:support@keygen.sh) if you have any
questions or concerns!
