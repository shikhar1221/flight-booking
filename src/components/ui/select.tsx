<select
id="title"
value={passengerDetails.title}
onValueChange={(value: string) =>
  setPassengerDetails((prev) => ({ ...prev, title: value }))
}
className={formErrors.title ? 'border-red-500' : ''}
>
<option value="">Select title</option>
<option value="Mr">Mr</option>
<option value="Mrs">Mrs</option>
<option value="Ms">Ms</option>
<option value="Dr">Dr</option>
</select>