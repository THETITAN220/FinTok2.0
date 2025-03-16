'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';

const LoanForm = () => {
  const [formData, setFormData] = useState({
    salary: '',
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
          <Label htmlFor="salary"> Salary</Label>
          <Input id="salary" name="salary" type="number" value={formData.salary} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="loanType">Type of Loan</Label>
          <Select name="loanType" value={formData.loanType} onValueChange={(value) => setFormData({ ...formData, loanType: value })} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Loan Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="personal">Personal Loan</SelectItem>
              <SelectItem value="home">Home Loan</SelectItem>
              <SelectItem value="auto">Auto Loan</SelectItem>
              <SelectItem value="education">Education Loan</SelectItem>
            </SelectContent>
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
