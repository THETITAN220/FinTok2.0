'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const LoanForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    loanType: '',
    loanAmount: '',
    duration: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Data:', formData);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Loan Application Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Input id="address" name="address" type="text" value={formData.address} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="loanType">Type of Loan</Label>
          <Select name="loanType" value={formData.loanType} onValueChange={(value) => setFormData({ ...formData, loanType: value })} required>
            <option value="">Select Loan Type</option>
            <option value="personal">Personal Loan</option>
            <option value="home">Home Loan</option>
            <option value="auto">Auto Loan</option>
            <option value="education">Education Loan</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="loanAmount">Loan Amount</Label>
          <Input id="loanAmount" name="loanAmount" type="number" value={formData.loanAmount} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="duration">Duration (in years)</Label>
          <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleChange} required />
        </div>
        <Button type="submit" className="w-full">Apply Now</Button>
      </form>
    </div>
  );
};

export default LoanForm;
