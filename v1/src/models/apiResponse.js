class ApiResponse {
    constructor() {
      this.data = null;
      this.status = false;
      this.errors = [];
    }
  
    static success(data) {
      const response = new ApiResponse();
      response.status = true;
      response.data = data;
      
      return response;
    }
  
    static fail(errors) {
      const response = new ApiResponse();
      response.status = false;
      response.errors = errors || [];

      return response;
    }
  }
  
  class ErrorDetail {
    constructor(errorMessage, shouldShowErrorMessage = true) {
      this.errorMessage = errorMessage;
      this.shouldShowErrorMessage = shouldShowErrorMessage;
    }
  }
  
  module.exports = { ApiResponse, ErrorDetail };
  