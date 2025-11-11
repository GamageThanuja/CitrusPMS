"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Save, Edit, Globe, MapPin, Phone, Mail, Building } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  fetchHotelMasByHotelCode,
  selectHotelMas,
  selectHotelMasLoading,
  selectHotelMasError,
  type HotelMasDTO,
} from "@/redux/slices/fetchHotelMasByHotelCode";

import {
  updateHotelMas,
  selectUpdateHotelMasLoading,
  selectUpdateHotelMasError,
} from "@/redux/slices/updateHotelMasSlice";

export default function PropertyDetailsPage() {
  const dispatch = useDispatch<AppDispatch>();

  // Selectors
  const propertyData = useSelector(selectHotelMas);
  const loading = useSelector(selectHotelMasLoading);
  const error = useSelector(selectHotelMasError);
  
  const updating = useSelector(selectUpdateHotelMasLoading);
  const updateError = useSelector(selectUpdateHotelMasError);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<HotelMasDTO>>({});
  const [activeTab, setActiveTab] = useState("basic");

  // Get hotelCode from localStorage
  const hotelCode = typeof window !== 'undefined' ? localStorage.getItem("hotelCode") : null;

  // Fetch property data on mount
  useEffect(() => {
    if (hotelCode) {
      dispatch(fetchHotelMasByHotelCode({ hotelCode }));
    }
  }, [dispatch, hotelCode]);

  // Update form data when property data changes
  useEffect(() => {
    if (propertyData) {
      setFormData(propertyData);
    }
  }, [propertyData]);

  // Handle update success/error
  useEffect(() => {
    if (updateError) {
      toast.error(`Update failed: ${updateError}`);
    }
  }, [updateError]);

  const handleInputChange = (field: keyof HotelMasDTO, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData || !hotelCode) return;

    try {
      const updatePayload = {
        ...formData,
        hotelCode: hotelCode,
        hotelID: formData.hotelID || 0,
        hotelName: formData.hotelName || '',
        legalName: formData.legalName || '',
        address: formData.address || '',
        phone: formData.phone || '',
        email: formData.email || '',
        web: formData.web || '',
      } as HotelMasDTO;

      await dispatch(updateHotelMas(updatePayload)).unwrap();
      toast.success("Property details updated successfully");
      setIsEditing(false);
      dispatch(fetchHotelMasByHotelCode({ hotelCode }));
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const handleCancel = () => {
    if (propertyData) {
      setFormData(propertyData);
    }
    setIsEditing(false);
  };

  const handleRefresh = () => {
    if (hotelCode) {
      dispatch(fetchHotelMasByHotelCode({ hotelCode }));
    }
  };

  if (!hotelCode) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
          <p className="text-red-600 mt-4">Hotel code not found. Please log in again.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Details</h1>
            <p className="text-gray-600 mt-1">
              Manage your property information and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updating}>
                  <Save className="h-4 w-4 mr-2" />
                  {updating ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-red-600 border border-red-300 rounded p-3 bg-red-50">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !propertyData && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">Loading property details...</p>
          </div>
        )}

        {/* Property Details with Tabs */}
        {propertyData && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Policies
              </TabsTrigger>
              <TabsTrigger value="online" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Online
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Identification</CardTitle>
                    <CardDescription>Core property identification details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="hotelCode">Hotel Code</Label>
                      <Input
                        id="hotelCode"
                        value={formData.hotelCode || ""}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hotelName">Hotel Name *</Label>
                      <Input
                        id="hotelName"
                        value={formData.hotelName || ""}
                        onChange={(e) => handleInputChange("hotelName", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter hotel name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="legalName">Legal Name</Label>
                      <Input
                        id="legalName"
                        value={formData.legalName || ""}
                        onChange={(e) => handleInputChange("legalName", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter legal name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        value={formData.groupName || ""}
                        onChange={(e) => handleInputChange("groupName", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter group name"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>Legal and business details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="vatNo">VAT Number</Label>
                      <Input
                        id="vatNo"
                        value={formData.vatNo || ""}
                        onChange={(e) => handleInputChange("vatNo", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter VAT number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="companyRegNo">Company Registration</Label>
                      <Input
                        id="companyRegNo"
                        value={formData.companyRegNo || ""}
                        onChange={(e) => handleInputChange("companyRegNo", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter company registration number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="coopAddress">Cooperative Address</Label>
                      <Textarea
                        id="coopAddress"
                        value={formData.coopAddress || ""}
                        onChange={(e) => handleInputChange("coopAddress", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter cooperative address"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Property Features</CardTitle>
                    <CardDescription>Property characteristics and ratings</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="starCat">Star Category</Label>
                      <Input
                        id="starCat"
                        type="number"
                        value={formData.starCat || ""}
                        onChange={(e) => handleInputChange("starCat", parseInt(e.target.value) || null)}
                        disabled={!isEditing}
                        placeholder="1-5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hotelScore">Hotel Score</Label>
                      <Input
                        id="hotelScore"
                        type="number"
                        step="0.1"
                        value={formData.hotelScore || ""}
                        onChange={(e) => handleInputChange("hotelScore", parseFloat(e.target.value) || null)}
                        disabled={!isEditing}
                        placeholder="0-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hotelScoreDesc">Score Description</Label>
                      <Input
                        id="hotelScoreDesc"
                        value={formData.hotelScoreDesc || ""}
                        onChange={(e) => handleInputChange("hotelScoreDesc", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Score description"
                      />
                    </div>
                    <div className="flex items-center justify-between md:block">
                      <Label htmlFor="childFriendly" className="cursor-pointer md:mb-2">
                        Child Friendly
                      </Label>
                      <Switch
                        id="childFriendly"
                        checked={formData.childFriendly || false}
                        onCheckedChange={(checked) => handleInputChange("childFriendly", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Contact Information Tab */}
            <TabsContent value="contact" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Details</CardTitle>
                    <CardDescription>Primary contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address || ""}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter property address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsAppNo">WhatsApp Number</Label>
                      <Input
                        id="whatsAppNo"
                        value={formData.whatsAppNo || ""}
                        onChange={(e) => handleInputChange("whatsAppNo", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter WhatsApp number"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Online Presence</CardTitle>
                    <CardDescription>Website and digital presence</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="web">Website</Label>
                      <Input
                        id="web"
                        value={formData.web || ""}
                        onChange={(e) => handleInputChange("web", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter website URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="googleMapURL">Google Map URL</Label>
                      <Input
                        id="googleMapURL"
                        value={formData.googleMapURL || ""}
                        onChange={(e) => handleInputChange("googleMapURL", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter Google Maps URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={formData.latitude || ""}
                        onChange={(e) => handleInputChange("latitude", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter latitude"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={formData.longitude || ""}
                        onChange={(e) => handleInputChange("longitude", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter longitude"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Location Information</CardTitle>
                    <CardDescription>Geographical and mapping details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="embedMap">Embed Map Code</Label>
                      <Textarea
                        id="embedMap"
                        value={formData.embedMap || ""}
                        onChange={(e) => handleInputChange("embedMap", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter embed map HTML code"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="attractions">Nearby Attractions</Label>
                      <Textarea
                        id="attractions"
                        value={formData.attractions || ""}
                        onChange={(e) => handleInputChange("attractions", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter nearby attractions"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="airportPickupDropd">Airport Transfer Info</Label>
                      <Textarea
                        id="airportPickupDropd"
                        value={formData.airportPickupDropd || ""}
                        onChange={(e) => handleInputChange("airportPickupDropd", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter airport pickup/drop information"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Policies Tab */}
            <TabsContent value="policies" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Operational Policies</CardTitle>
                    <CardDescription>Guest policies and procedures</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="checkInTime">Check-in Time</Label>
                      <Input
                        id="checkInTime"
                        type="time"
                        value={formData.checkInTime?.substring(0, 5) || ""}
                        onChange={(e) => handleInputChange("checkInTime", e.target.value + ":00")}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkOutTime">Check-out Time</Label>
                      <Input
                        id="checkOutTime"
                        type="time"
                        value={formData.checkOutTime?.substring(0, 5) || ""}
                        onChange={(e) => handleInputChange("checkOutTime", e.target.value + ":00")}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cancellationPolicy">Cancellation Policy</Label>
                      <Textarea
                        id="cancellationPolicy"
                        value={formData.cancellationPolicy || ""}
                        onChange={(e) => handleInputChange("cancellationPolicy", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter cancellation policy"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="childPolicy">Child Policy</Label>
                      <Textarea
                        id="childPolicy"
                        value={formData.childPolicy || ""}
                        onChange={(e) => handleInputChange("childPolicy", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter child policy"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment & Terms</CardTitle>
                    <CardDescription>Financial policies and terms</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Textarea
                        id="paymentTerms"
                        value={formData.paymentTerms || ""}
                        onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter payment terms"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxation">Taxation Policy</Label>
                      <Textarea
                        id="taxation"
                        value={formData.taxation || ""}
                        onChange={(e) => handleInputChange("taxation", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter taxation details"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="promotions">Promotions</Label>
                      <Textarea
                        id="promotions"
                        value={formData.promotions || ""}
                        onChange={(e) => handleInputChange("promotions", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter current promotions"
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="allowManualDisc" className="cursor-pointer">
                        Allow Manual Discount
                      </Label>
                      <Switch
                        id="allowManualDisc"
                        checked={formData.allowManualDisc || false}
                        onCheckedChange={(checked) => handleInputChange("allowManualDisc", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>Notes and footer content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="notes">General Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes || ""}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter general notes"
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="footer">Footer Text</Label>
                      <Textarea
                        id="footer"
                        value={formData.footer || ""}
                        onChange={(e) => handleInputChange("footer", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter footer text"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Online Presence Tab */}
            <TabsContent value="online" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Internet Booking Engine</CardTitle>
                    <CardDescription>Online booking settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="ibeurl">IBE URL</Label>
                      <Input
                        id="ibeurl"
                        value={formData.ibeurl || ""}
                        onChange={(e) => handleInputChange("ibeurl", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter IBE URL"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibE_LogoURL">IBE Logo URL</Label>
                      <Input
                        id="ibE_LogoURL"
                        value={formData.ibE_LogoURL || ""}
                        onChange={(e) => handleInputChange("ibE_LogoURL", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter IBE logo URL"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ibE_LogoWidth">Logo Width</Label>
                        <Input
                          id="ibE_LogoWidth"
                          type="number"
                          value={formData.ibE_LogoWidth || ""}
                          onChange={(e) => handleInputChange("ibE_LogoWidth", parseInt(e.target.value) || null)}
                          disabled={!isEditing}
                          placeholder="Width"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ibE_LogoHeight">Logo Height</Label>
                        <Input
                          id="ibE_LogoHeight"
                          type="number"
                          value={formData.ibE_LogoHeight || ""}
                          onChange={(e) => handleInputChange("ibE_LogoHeight", parseInt(e.target.value) || null)}
                          disabled={!isEditing}
                          placeholder="Height"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="ibE_Header">IBE Header</Label>
                      <Textarea
                        id="ibE_Header"
                        value={formData.ibE_Header || ""}
                        onChange={(e) => handleInputChange("ibE_Header", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter IBE header content"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibE_Footer">IBE Footer</Label>
                      <Textarea
                        id="ibE_Footer"
                        value={formData.ibE_Footer || ""}
                        onChange={(e) => handleInputChange("ibE_Footer", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter IBE footer content"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>IBE Policies</CardTitle>
                    <CardDescription>Online booking policies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="ibE_CheckInTime">IBE Check-in Time</Label>
                      <Input
                        id="ibE_CheckInTime"
                        type="time"
                        value={formData.ibE_CheckInTime?.substring(0, 5) || ""}
                        onChange={(e) => handleInputChange("ibE_CheckInTime", e.target.value + ":00")}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibE_CheckOutTime">IBE Check-out Time</Label>
                      <Input
                        id="ibE_CheckOutTime"
                        type="time"
                        value={formData.ibE_CheckOutTime?.substring(0, 5) || ""}
                        onChange={(e) => handleInputChange("ibE_CheckOutTime", e.target.value + ":00")}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibE_CancellationPolicy">IBE Cancellation Policy</Label>
                      <Textarea
                        id="ibE_CancellationPolicy"
                        value={formData.ibE_CancellationPolicy || ""}
                        onChange={(e) => handleInputChange("ibE_CancellationPolicy", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter IBE cancellation policy"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibE_ChildPolicy">IBE Child Policy</Label>
                      <Textarea
                        id="ibE_ChildPolicy"
                        value={formData.ibE_ChildPolicy || ""}
                        onChange={(e) => handleInputChange("ibE_ChildPolicy", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter IBE child policy"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment & Technical</CardTitle>
                    <CardDescription>Online payment and technical settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ibE_AllowPayAtProperty" className="cursor-pointer">
                        Allow Pay at Property
                      </Label>
                      <Switch
                        id="ibE_AllowPayAtProperty"
                        checked={formData.ibE_AllowPayAtProperty || false}
                        onCheckedChange={(checked) => handleInputChange("ibE_AllowPayAtProperty", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ibE_isIPGActive" className="cursor-pointer">
                        IPG Active
                      </Label>
                      <Switch
                        id="ibE_isIPGActive"
                        checked={formData.ibE_isIPGActive || false}
                        onCheckedChange={(checked) => handleInputChange("ibE_isIPGActive", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ibE_Pay50" className="cursor-pointer">
                        Pay 50% Option
                      </Label>
                      <Switch
                        id="ibE_Pay50"
                        checked={formData.ibE_Pay50 || false}
                        onCheckedChange={(checked) => handleInputChange("ibE_Pay50", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isCancelUnpaidRes_IBE" className="cursor-pointer">
                        Cancel Unpaid IBE Reservations
                      </Label>
                      <Switch
                        id="isCancelUnpaidRes_IBE"
                        checked={formData.isCancelUnpaidRes_IBE || false}
                        onCheckedChange={(checked) => handleInputChange("isCancelUnpaidRes_IBE", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibE_TenRes_ReleaseTimeInMin">Tentative Release Time (min)</Label>
                      <Input
                        id="ibE_TenRes_ReleaseTimeInMin"
                        type="number"
                        value={formData.ibE_TenRes_ReleaseTimeInMin || ""}
                        onChange={(e) => handleInputChange("ibE_TenRes_ReleaseTimeInMin", parseInt(e.target.value) || null)}
                        disabled={!isEditing}
                        placeholder="Minutes"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email & Analytics</CardTitle>
                    <CardDescription>Email and tracking settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="e_SenderEmail">Sender Email</Label>
                      <Input
                        id="e_SenderEmail"
                        type="email"
                        value={formData.e_SenderEmail || ""}
                        onChange={(e) => handleInputChange("e_SenderEmail", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter sender email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="googleAnalyticsID">Google Analytics ID</Label>
                      <Input
                        id="googleAnalyticsID"
                        value={formData.googleAnalyticsID || ""}
                        onChange={(e) => handleInputChange("googleAnalyticsID", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter GA tracking ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hotelNetworkID">Hotel Network ID</Label>
                      <Input
                        id="hotelNetworkID"
                        value={formData.hotelNetworkID || ""}
                        onChange={(e) => handleInputChange("hotelNetworkID", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter hotel network ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="exoticAuthKey">Exotic Auth Key</Label>
                      <Input
                        id="exoticAuthKey"
                        value={formData.exoticAuthKey || ""}
                        onChange={(e) => handleInputChange("exoticAuthKey", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter exotic auth key"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                    <CardDescription>Core system configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="finAct" className="cursor-pointer">
                        Financial Activity
                      </Label>
                      <Switch
                        id="finAct"
                        checked={formData.finAct || false}
                        onCheckedChange={(checked) => handleInputChange("finAct", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isChannelManagerActive" className="cursor-pointer">
                        Channel Manager Active
                      </Label>
                      <Switch
                        id="isChannelManagerActive"
                        checked={formData.isChannelManagerActive || false}
                        onCheckedChange={(checked) => handleInputChange("isChannelManagerActive", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="isTranLevelApprovalActive" className="cursor-pointer">
                        Transaction Level Approval
                      </Label>
                      <Switch
                        id="isTranLevelApprovalActive"
                        checked={formData.isTranLevelApprovalActive || false}
                        onCheckedChange={(checked) => handleInputChange("isTranLevelApprovalActive", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="roomRevenueByRoomWise" className="cursor-pointer">
                        Room Revenue by Room
                      </Label>
                      <Switch
                        id="roomRevenueByRoomWise"
                        checked={formData.roomRevenueByRoomWise || false}
                        onCheckedChange={(checked) => handleInputChange("roomRevenueByRoomWise", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="recordCostForComplementRooms" className="cursor-pointer">
                        Record Cost for Complimentary Rooms
                      </Label>
                      <Switch
                        id="recordCostForComplementRooms"
                        checked={formData.recordCostForComplementRooms || false}
                        onCheckedChange={(checked) => handleInputChange("recordCostForComplementRooms", checked)}
                        disabled={!isEditing}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Channel Manager</CardTitle>
                    <CardDescription>Channel manager credentials</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="cM_Username">CM Username</Label>
                      <Input
                        id="cM_Username"
                        value={formData.cM_Username || ""}
                        onChange={(e) => handleInputChange("cM_Username", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter channel manager username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cM_Password">CM Password</Label>
                      <Input
                        id="cM_Password"
                        type="password"
                        value={formData.cM_Password || ""}
                        onChange={(e) => handleInputChange("cM_Password", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter channel manager password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cM_PropertyID">CM Property ID</Label>
                      <Input
                        id="cM_PropertyID"
                        value={formData.cM_PropertyID || ""}
                        onChange={(e) => handleInputChange("cM_PropertyID", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter channel manager property ID"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cmName">CM Name</Label>
                      <Input
                        id="cmName"
                        value={formData.cmName || ""}
                        onChange={(e) => handleInputChange("cmName", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter channel manager name"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Settings</CardTitle>
                    <CardDescription>SMTP configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="e_SMTP_SERVER">SMTP Server</Label>
                      <Input
                        id="e_SMTP_SERVER"
                        value={formData.e_SMTP_SERVER || ""}
                        onChange={(e) => handleInputChange("e_SMTP_SERVER", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter SMTP server"
                      />
                    </div>
                    <div>
                      <Label htmlFor="e_SMTP_Port">SMTP Port</Label>
                      <Input
                        id="e_SMTP_Port"
                        value={formData.e_SMTP_Port || ""}
                        onChange={(e) => handleInputChange("e_SMTP_Port", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter SMTP port"
                      />
                    </div>
                    <div>
                      <Label htmlFor="e_SMTP_Password">SMTP Password</Label>
                      <Input
                        id="e_SMTP_Password"
                        type="password"
                        value={formData.e_SMTP_Password || ""}
                        onChange={(e) => handleInputChange("e_SMTP_Password", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter SMTP password"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Additional Settings</CardTitle>
                    <CardDescription>Miscellaneous configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="homeCurrencyCode">Home Currency</Label>
                      <Input
                        id="homeCurrencyCode"
                        value={formData.homeCurrencyCode || ""}
                        onChange={(e) => handleInputChange("homeCurrencyCode", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter home currency code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="grnLeadTime">GRN Lead Time (days)</Label>
                      <Input
                        id="grnLeadTime"
                        type="number"
                        value={formData.grnLeadTime || ""}
                        onChange={(e) => handleInputChange("grnLeadTime", parseInt(e.target.value) || null)}
                        disabled={!isEditing}
                        placeholder="Enter GRN lead time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ibeHeaderColour">IBE Header Color</Label>
                      <Input
                        id="ibeHeaderColour"
                        type="color"
                        value={formData.ibeHeaderColour || "#000000"}
                        onChange={(e) => handleInputChange("ibeHeaderColour", e.target.value)}
                        disabled={!isEditing}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="saPassword">SA Password</Label>
                      <Input
                        id="saPassword"
                        type="password"
                        value={formData.saPassword || ""}
                        onChange={(e) => handleInputChange("saPassword", e.target.value)}
                        disabled={!isEditing}
                        placeholder="Enter SA password"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Empty State */}
        {!loading && !propertyData && !error && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">No property data found.</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}