## Quest UI Kit - Path Component POC - TODO

**1. Create Message Channel**
- [ ] Create `qPathStep.messageChannel-meta.xml` in `force-app/main/default/messageChannels/`
- [ ] Define single field: `currentStep` (string)

**2. Build Path Component**
- [ ] Create `qPath` LWC
- [ ] Hardcode three steps: step1, step2, step3
- [ ] Import LMS modules (publish, MessageContext)
- [ ] Implement click handlers to publish `{ currentStep: 'step1' }` (etc.)
- [ ] Style to look like Salesforce Path component
- [ ] Set step1 as initially selected

**3. Build Header Component**
- [ ] Create `qHeader` LWC
- [ ] Add `@api assignedStep` property
- [ ] Import LMS modules (subscribe, MessageContext)
- [ ] Subscribe to PathStep channel
- [ ] Add conditional rendering: show only when `currentStep === assignedStep`
- [ ] Display different header content for each step

**4. Create Test Flow**
- [ ] Build simple Screen Flow
- [ ] Add `qPath` component to screen
- [ ] Add three `qHeader` components to screen
- [ ] Configure each header: assignedStep='step1', assignedStep='step2', assignedStep='step3'

**5. Validation**
- [ ] Verify only one header shows at a time
- [ ] Confirm headers switch reactively on path clicks
- [ ] Check browser console for errors