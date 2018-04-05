module Api
  module V1
    class InterviewController < ApplicationController
      before_action :logged_in_user, only: [:create, :edit, :update, :show, :destroy]
      before_action :correct_user, only: [:edit, :update, :show, :destroy]

      def show
        @interview = Interview.find(params[:id])
        render json: @interview
      end

      def new
        @interview = Interview.new
      end

      def create
        @interview = Interview.new(interview_params)
        if @interview.save
          redirect_to @interview
        else
          render 'new'
        end
      end

      def edit
        @interview = Interview.find(params[:id])
      end

      def update
        @interview = Interview.find(params[:id])
        if @interview.update(interview_params)
          redirect_to @interview
        else
          render 'edit'
        end
      end

      def destroy
        @interview = Interview.find(params[:id])
        @interview.destroy
      end

      private
      def interview_params
        params.require(:interview).permit(:date, :notes)
      end

      def logged_in_user
        unless logged_in?
          flash[:danger] = "Please log in"
          redirect_to login_url unless current_user?(@user)
        end
      end

      def correct_user
        @interview = current_user.interviews.find_by(id: params[:id])
        redirect_to root_url if @interview.nil?
      end
    end
  end
end
