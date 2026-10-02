import json, os, sys
D = os.path.dirname(os.path.abspath(__file__))
ROLES = ['employee', 'qms', 'owner', 'maintenance', 'auditor']
HEAD = ['Employee', 'QMS', 'Segment Director', 'Maintenance Manager', 'Auditor']
A, R = 'ALLOWED', 'REFUSED'
# Expected, from roles.js / store.js as established in section 2 (not from the run).
EXP = {
  'Open: Home': [A]*5, 'Open: Segment, Operations side': [A]*5, 'Open: Segment, Maintenance side': [A]*5,
  'Open: Search': [A]*5, 'Open: Field Glossary': [A]*5, 'Open: Ask Expert': [A]*5,
  'Open: Viewer, published (Ops)': [A]*5, 'Open: Viewer, published (Maint)': [A]*5,
  'Open: Upload': [A, A, A, A, R],
  'Open: Desk, own area': [R, A, A, A, R], 'Open: Desk, other area': [R, A, R, R, R],
  'Open: Published list, own area': [R, A, A, A, R], 'Open: Published list, other area': [R, A, R, R, R],
  'Open: Master List': [R, A, R, R, A], 'Open: Analytics': [R, A, R, R, A], "Open: About / What's new": [R, A, R, R, A],
  "Read someone else's draft, own area": [R, A, A, A, A], "Read someone else's draft, other area": [R, A, R, R, A],
  'File a document': [A, A, A, A, R],
  'QMS check (countersign)': [R, A, R, R, R],
  'Approve Operations SOP (own area)': [R, R, A, R, R],
  'Approve Maintenance SOP (own area)': [R, R, R, A, R],
  'Approve Maintenance Bulletin (own area)': [R, R, R, A, R],
  'Approve in another area (Drilling)': [R]*5,
  'Reject at QMS step': [R, A, R, R, R],
  'Reject Operations SOP at final step': [R, R, A, R, R],
  'Reject Maintenance SOP at final step': [R, R, R, A, R],
  'Withdraw published Operations doc (own area)': [R, A, A, A, R],
  'Withdraw published Maintenance doc (own area)': [R, A, A, A, R],
  'Edit record details (own area)': [R, A, A, A, R],
  'Write a lifecycle field by editing': [R]*5,
  'Export F086 register': [R, A, R, R, A],
  'Master List bulk actions': [R, A, R, R, R],
  'Delegate authority': [R, R, A, A, R],
}
NOTE = {
  'Withdraw published Operations doc (own area)': 'MM column: allowed by `canManage` (no department check). Decision needed: see section 9.',
  'Edit record details (own area)': 'MM column: same; edit covers Operations records in the MM\'s segment.',
  'Approve in another area (Drilling)': 'QMS holds no approve; Director/MM hold it for their own area only.',
}
def table(mode):
    m = json.load(open(os.path.join(D, '..', 'results-baseline-1de6bbe', f'tour-{mode}.json')))
    out = ['| Page / action | ' + ' | '.join(HEAD) + ' |', '|---' * 6 + '|']
    defects = []
    for k, exp in EXP.items():
        row = m.get(k, {})
        cells = []
        for i, r in enumerate(ROLES):
            got = (row.get(r) or {}).get('v', 'NOT RUN')
            if got == exp[i]: cells.append(got)
            else:
                cells.append(f'**DEFECT** (got {got}, rule {exp[i]})'); defects.append((k, r, got, exp[i]))
        out.append(f'| {k} | ' + ' | '.join(cells) + ' |')
    err = m.get('Uncaught page errors', {}).get('all', {})
    return '\n'.join(out), defects, err
if __name__ == '__main__':
    for mode in sys.argv[1:] or ['desktop', 'phone']:
        t, d, e = table(mode)
        print(f'### {mode}\n'); print(t); print('\ndefects:', d, '\npage errors:', e, '\n')
