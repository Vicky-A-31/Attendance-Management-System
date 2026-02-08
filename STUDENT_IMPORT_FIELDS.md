# Student Import Template - Field Reference

## Based on "Add New Student" Form

This template matches exactly what the Add Student form collects.

---

## Required Fields (9 fields total)

| Field           | Description           | Example               | Notes                        |
| --------------- | --------------------- | --------------------- | ---------------------------- |
| **name**        | Full name of student  | John Doe              | Required                     |
| **email**       | Email address         | john.doe@example.com  | Required, must be unique     |
| **rollNo**      | Roll number           | CS001                 | Required, must be unique     |
| **department**  | Department name       | Computer Science      | Required, dropdown value     |
| **year**        | Academic year         | 1st Year              | Required, dropdown value     |
| **parentPhone** | Parent/Guardian phone | +91 9876543210        | Required                     |
| **dateOfBirth** | Date of birth         | 2005-01-15            | Required, format: YYYY-MM-DD |
| **bloodGroup**  | Blood group           | A+                    | Optional, dropdown value     |
| **address**     | Full address          | 123 Main Street, City | Required                     |

---

## Valid Values

### Department Options:

- Computer Science
- Electronics
- Mechanical
- Civil
- Electrical
- IT
- Other

### Year Options:

- 1st Year
- 2nd Year
- 3rd Year
- 4th Year

### Blood Group Options (Optional):

- A+
- A-
- B+
- B-
- AB+
- AB-
- O+
- O-
- (Leave empty if unknown)

---

## CSV Template Structure

```csv
name,email,rollNo,department,year,parentPhone,dateOfBirth,bloodGroup,address
John Doe,john.doe@example.com,CS001,Computer Science,1st Year,+91 9876543210,2005-01-15,A+,"123 Main Street, City, State"
```

---

## Sample Data (Already in Template)

### Student 1:

- Name: John Doe
- Email: john.doe@example.com
- Roll No: CS001
- Department: Computer Science
- Year: 1st Year
- Parent Phone: +91 9876543210
- Date of Birth: 2005-01-15
- Blood Group: A+
- Address: 123 Main Street, City, State

### Student 2:

- Name: Jane Smith
- Email: jane.smith@example.com
- Roll No: CS002
- Department: Computer Science
- Year: 1st Year
- Parent Phone: +91 9876543211
- Date of Birth: 2005-03-20
- Blood Group: B+
- Address: 456 Oak Avenue, City, State

### Student 3:

- Name: Mike Johnson
- Email: mike.johnson@example.com
- Roll No: EE001
- Department: Electrical
- Year: 2nd Year
- Parent Phone: +91 9876543212
- Date of Birth: 2004-07-10
- Blood Group: O+
- Address: 789 Pine Road, City, State

---

## Important Notes

1. **Date Format**: Always use YYYY-MM-DD (e.g., 2005-01-15)
2. **Phone Format**: Include country code (e.g., +91 for India)
3. **Unique Fields**: Email and Roll Number must be unique
4. **Department & Year**: Must match exactly from the dropdown lists
5. **Address**: Use quotes if it contains commas
6. **Blood Group**: Can be left empty if unknown

---

## Removed Fields

These fields were in the old template but are NOT in the Add Student form:

- ❌ semester (not collected)
- ❌ batch (not collected)
- ❌ phone (student's personal phone - not collected)

Only the 9 fields shown above are collected and should be in the CSV.

---

**Use this template for bulk importing students!**
