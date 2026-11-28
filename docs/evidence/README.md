# Evidence Index

Actual evidence captured from the running Vehicle Service Centre Job Card Management System (Angular frontend, Spring Boot API, MySQL database). No screenshots, API responses, or database records were fabricated.

## New evidence screenshots

| Filename | Demonstrates | Supports |
|---|---|---|
| `create_form_filled.png` | Customer create form filled with realistic test data before submission | Page 17 - Create evidence |
| `create_success.png` | Successful creation result showing saved customer detail | Page 17 - Create evidence |
| `create_in_list.png` | Newly created record visible in customer listing/search | Page 17 - Create evidence |
| `update_before.png` | Existing customer record before update (original values) | Page 19 - Update evidence |
| `update_form.png` | Edit form with modified address and phone values | Page 19 - Update evidence |
| `update_after.png` | Updated customer record after save showing changed values | Page 19 - Update evidence |
| `delete_before.png` | Safe test customer record in listing before deletion | Page 20 - Delete evidence |
| `delete_confirmation.png` | Delete confirmation dialog before confirming deletion | Page 20 - Delete evidence |
| `delete_success.png` | Deletion success message and updated listing after deletion | Page 20 - Delete evidence |
| `postman_get.png` | Actual GET request/response against live API (200) | Page 21 - API evidence |
| `postman_post.png` | Actual POST create request body and response (201) | Page 21 - API evidence |
| `postman_put.png` | Actual PUT update request body and response (200) | Page 21 - API evidence |
| `postman_delete.png` | Actual DELETE request and response (204) | Page 21 - API evidence |
| `postman_status_update.png` | Actual job-card status transition OPEN -> IN_PROGRESS (200) | Page 21 - API evidence |
| `mysql_workbench_schema.png` | Actual MySQL schema/tables/structures from live project DB | Page 22 - Database evidence |
| `mysql_workbench_tables.png` | Actual MySQL table structures and columns from live project DB | Page 22 - Database evidence |
| `mysql_workbench_relationships.png` | Actual foreign-key relationships and sample records from live project DB | Page 22 - Database evidence |

## Environment notes

- **Postman GUI**: Postman desktop/web GUI was not installed/available in this environment. `postman_*.png` files capture real requests executed against the running local API (`http://127.0.0.1:8080/api`) with actual response status codes and bodies; they are explicitly labeled as non-GUI rendered evidence.
- **MySQL Workbench GUI**: MySQL Workbench GUI was not installed/available in this environment. `mysql_workbench_*.png` files capture real SQL query output executed against the live project database; they are explicitly labeled as non-GUI rendered evidence.
- Test records used for create/update/delete evidence were disposable; temporary evidence records created during capture were cleaned up where safe.

## Existing evidence files

The directory also contains earlier Phase 7 evidence artifacts (`01-setup.png` through `08-database.png`, HTML transcripts, Newman/test logs, and constraint checks). See [`../README.md`](../README.md) and [`../test-matrix.md`](../test-matrix.md) for the broader evidence mapping.
