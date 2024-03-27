# PagerDuty On-call Action

A GitHub Action to find who is on call through PagerDuty.

## Usage

```yml
name: Find who is on call for a given schedule or escalation policy.
on:
  schedule:
    - cron: 0 8 * * 1
jobs:
  run-action:
    runs-on: ubuntu-latest
    steps:
    - name: Ask PagerDuty
      id: pagerduty
      uses: mxie/pagerduty-oncall-action@main    # replace `main` with release tag
      with:
        token: ${{ secrets.PAGERDUTY_TOKEN }}
        # schedule-id or escalation-policy-id required, or both.
        schedule-id: ABCDEFG
        escalation-policy-id: ABCDEFG
    - name: Print user who is on call at escalation level 1
      run: echo ${{ steps.pagerduty.outputs.person }} is on call
```

See [action.yml](./action.yml) for accepted inputs.
