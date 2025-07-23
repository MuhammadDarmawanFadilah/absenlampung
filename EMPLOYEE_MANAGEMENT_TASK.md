# Employee Management System Implementation Task

## Overview
Implement 4 employee management menus based on the absensi Laravel example with modern Spring Boot backend and Next.js frontend using shadcn/ui components.

## Target Menus
1. **Data Pegawai** (Employee Data)
2. **Jabatan** (Positions/Jobs) 
3. **Shift** (Work Shifts)
4. **Lokasi Kantor** (Office Locations)

## Implementation Requirements

### Backend (Spring Boot)
- Create/Update entities, repositories, services, and controllers
- Implement CRUD operations (Create, Read, Update, Delete)
- Add proper validation and error handling
- Use consistent patterns with existing codebase
- Implement pagination and search functionality
- Add proper security annotations (@PreAuthorize)

### Frontend (Next.js + shadcn/ui)
- Create modern, professional UI pages
- Implement full CRUD operations with page navigation (not modals)
- Use shadcn/ui components for consistent styling
- Add proper form validation using React Hook Form + Zod
- Implement search and pagination
- Add confirmation dialogs for delete operations
- Use proper loading states and error handling

### App Sidebar Updates
- Add "Manajemen Karyawan" section to sidebar
- Include all 4 menu items under this section
- Ensure proper navigation and active states

## Detailed Tasks

### Phase 1: Backend Entities and Database
1. **Employee (Pegawai) Entity Enhancement**
   - Review existing Pegawai entity
   - Add missing fields based on absensi example
   - Update relationships with Jabatan, Shift, Lokasi

2. **Shift Entity**
   - Create Shift entity with fields: id, nama_shift, jam_masuk, jam_keluar, category
   - Add repository, service, controller
   - Implement CRUD operations

3. **Lokasi (Office Location) Entity**
   - Create Lokasi entity with fields: id, nama_lokasi, alamat, lat, lng, radius
   - Add repository, service, controller
   - Implement CRUD operations

4. **Update Jabatan Entity**
   - Review existing Jabatan entity
   - Add manager field (user_id reference)
   - Update service methods

### Phase 2: Backend Services and Controllers
1. **Shift Management**
   - ShiftRepository with search and pagination
   - ShiftService with business logic
   - ShiftController with REST endpoints
   - Validation and error handling

2. **Lokasi Management**
   - LokasiRepository with search and pagination
   - LokasiService with business logic
   - LokasiController with REST endpoints
   - Validation and error handling

3. **Enhanced Pegawai Management**
   - Update PegawaiService for shift and location assignments
   - Add bulk operations support
   - Enhanced search and filtering

4. **Enhanced Jabatan Management**
   - Update existing Jabatan controller
   - Add manager assignment functionality
   - Add member count functionality

### Phase 3: Frontend Components and Pages
1. **Data Pegawai Pages**
   - List page with table, search, pagination
   - Create page with form validation
   - Edit page with pre-filled data
   - Detail page with comprehensive view
   - Delete confirmation

2. **Jabatan Pages**
   - List page with manager and member info
   - Create page with manager selection
   - Edit page with validation
   - Detail page showing assigned members
   - Delete with dependency check

3. **Shift Pages**
   - List page with time display
   - Create page with time pickers
   - Edit page with validation
   - Detail page with assigned employees
   - Delete confirmation

4. **Lokasi Kantor Pages**
   - List page with address display
   - Create page with location picker
   - Edit page with map integration
   - Detail page with GPS coordinates
   - Delete confirmation

### Phase 4: Navigation and Integration
1. **App Sidebar Updates**
   - Add "Manajemen Karyawan" collapsible section
   - Include 4 menu items with proper icons
   - Ensure admin/moderator access control

2. **Navigation Flow**
   - Implement breadcrumb navigation
   - Add proper back buttons
   - Ensure consistent routing

3. **Integration Testing**
   - Test all CRUD operations
   - Verify relationships between entities
   - Test pagination and search
   - Verify form validations

## Expected File Structure

### Backend Files
```
backend/src/main/java/com/shadcn/backend/
├── model/
│   ├── Pegawai.java (enhanced)
│   ├── Jabatan.java (enhanced)
│   ├── Shift.java (new)
│   └── Lokasi.java (new)
├── repository/
│   ├── PegawaiRepository.java (enhanced)
│   ├── JabatanRepository.java (enhanced)
│   ├── ShiftRepository.java (new)
│   └── LokasiRepository.java (new)
├── service/
│   ├── PegawaiService.java (enhanced)
│   ├── JabatanService.java (enhanced)
│   ├── ShiftService.java (new)
│   └── LokasiService.java (new)
├── controller/
│   ├── PegawaiController.java (enhanced)
│   ├── JabatanController.java (enhanced)
│   ├── ShiftController.java (new)
│   └── LokasiController.java (new)
└── dto/
    ├── ShiftRequest.java (new)
    ├── ShiftResponse.java (new)
    ├── LokasiRequest.java (new)
    └── LokasiResponse.java (new)
```

### Frontend Files
```
frontend/src/
├── app/
│   ├── admin/
│   │   ├── pegawai/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   ├── edit/[id]/page.tsx
│   │   │   └── detail/[id]/page.tsx
│   │   ├── jabatan/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   ├── edit/[id]/page.tsx
│   │   │   └── detail/[id]/page.tsx
│   │   ├── shift/
│   │   │   ├── page.tsx
│   │   │   ├── create/page.tsx
│   │   │   ├── edit/[id]/page.tsx
│   │   │   └── detail/[id]/page.tsx
│   │   └── lokasi/
│   │       ├── page.tsx
│   │       ├── create/page.tsx
│   │       ├── edit/[id]/page.tsx
│   │       └── detail/[id]/page.tsx
├── components/
│   ├── employee/
│   │   ├── PegawaiTable.tsx
│   │   ├── PegawaiForm.tsx
│   │   ├── PegawaiFilters.tsx
│   │   └── PegawaiDetail.tsx
│   ├── jabatan/
│   │   ├── JabatanTable.tsx
│   │   ├── JabatanForm.tsx
│   │   └── JabatanDetail.tsx
│   ├── shift/
│   │   ├── ShiftTable.tsx
│   │   ├── ShiftForm.tsx
│   │   └── ShiftDetail.tsx
│   └── lokasi/
│       ├── LokasiTable.tsx
│       ├── LokasiForm.tsx
│       └── LokasiDetail.tsx
└── services/
    ├── pegawaiService.ts (enhanced)
    ├── jabatanService.ts (enhanced)
    ├── shiftService.ts (new)
    └── lokasiService.ts (new)
```

## Design Specifications

### UI Components
- Use shadcn/ui components consistently
- Professional card-based layouts
- Responsive design for mobile and desktop
- Consistent color scheme and typography
- Loading states and error messages
- Success notifications

### Form Patterns
- React Hook Form for form management
- Zod for validation schemas
- Real-time validation feedback
- Proper error handling and display
- File upload support where needed

### Table Features
- Server-side pagination
- Search functionality
- Sortable columns
- Action buttons (View, Edit, Delete)
- Responsive table design
- Loading states

### Navigation
- Breadcrumb navigation
- Consistent routing patterns
- Active menu highlighting
- Mobile-responsive sidebar
- Back button functionality

## Success Criteria
1. All 4 menus fully functional with CRUD operations
2. Backend can be started without errors
3. Frontend can be built successfully
4. Navigation works correctly
5. Data validation functions properly
6. Professional and modern UI design
7. Responsive across devices
8. No corruption of existing functionality
9. Proper error handling and user feedback
10. Code follows existing patterns and conventions

## Implementation Order
1. Create task.md (this file)
2. Implement backend entities and repositories
3. Implement backend services and controllers
4. Test backend endpoints
5. Create frontend services
6. Implement frontend pages and components
7. Update app sidebar
8. Integration testing
9. Final validation and cleanup
