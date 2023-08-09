import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import {
  retrieveMultiple,
  RetrieveMultipleResponse,
  WebApiConfig,
} from 'xrm-webapi';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor() {}

  //Pagination variable declartions
  currentPage = 1;
  itemsPerPage = 10;

  response: any;
  loggedInUserName: string | undefined;
  contactGuid: string | null = null;

  //  Attributes [Activity Subject, date created, owner, status] to show the data.
  data: {
    subject: string;
    status: string;
    createdOn: Date;
    owner: string;
    ownerId: string;
    activitytypecode: string;
    activityId: string;
  }[] = [];

  searchText = '';

  filteredData: {
    subject: string;
    status: string;
    createdOn: Date;
    owner: string;
    ownerId: string;
    activitytypecode: string;
    activityId: string;
  }[] = [];

  ngOnInit(): void {
    this.fetchContactIdFromURL();
    this.fetchData();
  }

  fetchContactIdFromURL(): void {
    const params = new URLSearchParams(window.parent.document.location.search);
    this.contactGuid = params.get('id');
  }

  fetchData() {
    const context =
      typeof GetGlobalContext !== 'undefined'
        ? GetGlobalContext()
        : Xrm.Utility.getGlobalContext();
    this.loggedInUserName = context.userSettings.userName;
    this.response = [];

    //fetchXML for getting the data of activities

    const pageNumber = 1;
    const pageSize = 5000;


    const retrieveRecordsProcess = (pageNumber:number) => {
      var fetchXml=calledFetchXML(pageNumber);
    
      Xrm.WebApi.retrieveMultipleRecords('activitypointer', `?fetchXml=${encodeURIComponent(fetchXml)}`).then(
        (result) => {
          this.response = this.response.concat(result.entities);
          if (result.entities.length === pageSize) {
            retrieveRecordsProcess(pageNumber + 1);
          } else {
            // If there are no more records, proceed with processing the data
            this.loadTable(this.response);
          }
        },
        function (error) {
          console.log(error.message);
        }
      );
    }

    const calledFetchXML = (pageNumber: number) => {
      const fetchXml= `<fetch returntotalrecordcount="true" page="${pageNumber}">
                        <entity name="activitypointer">
                          <attribute name="subject" />
                          <attribute name="statecode" />
                          <attribute name="createdon" />
                          <attribute name="ownerid" />
                          <attribute name="activitytypecode" />
                          <attribute name="activityid" />
                          <filter type="and">
                            <condition attribute="regardingobjectid" operator="eq" uitype="contact" value="${this.contactGuid}" />
                          </filter>
                          <order attribute="subject" descending="false" />
                        </entity>
                      </fetch>`;
      return fetchXml;
    }

  retrieveRecordsProcess(pageNumber);
}

  // Function to load the data into the table

  loadTable(result: any) {
    this.data = [];
    for (const entity of result) {
      const subject = entity['subject'];
      const status =
        entity['statecode@OData.Community.Display.V1.FormattedValue'];
      const createdOn =
        entity['createdon@OData.Community.Display.V1.FormattedValue'];
      const owner =
        entity['_ownerid_value@OData.Community.Display.V1.FormattedValue'];
      const ownerId = entity['_ownerid_value'];
      const activityId = entity['activityid'];
      const activitytypecode = entity['activitytypecode'];

    // Pushing data into the data array

      this.data.push({
        subject: subject,
        status: status,
        createdOn: createdOn,
        owner: owner,
        ownerId: ownerId,
        activitytypecode: activitytypecode,
        activityId: activityId,
      });

      this.filteredData = [...this.data];
    }
    this.applyPagination();
  }

  // Function to apply pagination on the data

  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.filteredData = this.data.slice(
      startIndex,
      startIndex + this.itemsPerPage
    );
  }

 // Function to navigate to a specific page

  goToPage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.totalPages) {
      this.currentPage = pageNumber;
      this.applyPagination();
    }
  }

  // Function to navigate to the previous page

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  // Function to navigate to the next page

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

// Function to navigate to the next page

  goToNexterPage(): void {
    this.goToPage(this.currentPage + 50);
  }

  // Get the total number of pages

  get totalPages(): number {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  // Function to reload the table data

  loadData() {
    this.loadTable(this.response);
  }

  // Function to open the activity form for a specific subject

  openActivityForm(activityId: string, activityTypecode: string) {
      const entityFormOptions: Xrm.Navigation.EntityFormOptions = {
        entityName: activityTypecode,
        entityId: activityId,
        openInNewWindow: true,
        windowPosition: 1,
      };

      Xrm.Navigation.openForm(entityFormOptions).then(
        () => {
          console.log('Activity form opened successfully');
        },
        (error) => {
          console.log('Error opening activity form:', error);
        }
      );
  }

  // Function to apply filtering on the data

  applyFilter(): void {
    if (!this.searchText) {
      this.filteredData = [...this.data];
      return;
    }

    const filterValue = this.searchText.toLowerCase();
    this.filteredData = this.data.filter((row) =>
      row.subject.toLowerCase().includes(filterValue)
    );
  }

  // Function to open the owner detail page for a specific owner

  openOwnerDetail(ownerId: string) {
    const entityFormOptions: Xrm.Navigation.EntityFormOptions = {
      entityName: 'systemuser',
      entityId: ownerId,
      openInNewWindow: true,
      windowPosition: 1,
    };

    Xrm.Navigation.openForm(entityFormOptions).then(
      () => {
        console.log('Owner detail page opened successfully');
      },
      (error) => {
        console.log('Error opening owner detail page:', error);
      }
    );
  }
}
