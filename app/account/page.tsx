"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTranslatedText } from "@/lib/translation";
import { Pencil, Save, User } from "lucide-react";
import { getAllUsers } from "@/controllers/adminController";

export default function AccountPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info on page load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const tokenData = localStorage.getItem("hotelmateTokens");
        const userId = localStorage.getItem("userId");

        if (!tokenData || !userId) {
          console.error("Token or User ID not found in localStorage.");
          setLoading(false);
          return;
        }

        const { accessToken } = JSON.parse(tokenData);

        const response = await getAllUsers({ token: accessToken });

        console.log("Response from getAllUsers 🍄 🍄 🍄:", response);

        const matchingUser = response.find((user: any) => user.id === userId);

        if (matchingUser) {
          setUserData({
            name: matchingUser.fullName || "",
            email: matchingUser.email || "",
            phone: "", // API does not provide phone - you can extend this later if needed
            jobTitle: matchingUser.roles?.join(", ") || "",
            company: "", // API does not provide company
            address: "", // API does not provide address
            bio: "", // API does not provide bio
          });
        } else {
          console.error("User not found in list.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (field: string, value: string) => {
    setUserData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // You can also add an API call here to save edited user details to the server
  };

  const accountText = useTranslatedText("Account");
  const profileText = useTranslatedText("Profile");
  const securityText = useTranslatedText("Security");
  const preferencesText = useTranslatedText("Preferences");
  const personalInfoText = useTranslatedText("Personal Information");
  const manageYourAccountText = useTranslatedText(
    "Manage your account information"
  );
  const nameText = useTranslatedText("Name");
  const emailText = useTranslatedText("Email");
  const phoneText = useTranslatedText("Phone");
  const jobTitleText = useTranslatedText("Job Title");
  const companyText = useTranslatedText("Company");
  const addressText = useTranslatedText("Address");
  const bioText = useTranslatedText("Bio");
  const editText = useTranslatedText("Edit");
  const saveText = useTranslatedText("Save");
  const cancelText = useTranslatedText("Cancel");
  const passwordText = useTranslatedText("Password");
  const currentPasswordText = useTranslatedText("Current Password");
  const newPasswordText = useTranslatedText("New Password");
  const confirmPasswordText = useTranslatedText("Confirm Password");
  const updatePasswordText = useTranslatedText("Update Password");
  const languageText = useTranslatedText("Language");
  const themeText = useTranslatedText("Theme");
  const timeZoneText = useTranslatedText("Time Zone");
  const dateFormatText = useTranslatedText("Date Format");
  const saveChangesText = useTranslatedText("Save Changes");

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <span>Loading...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!userData) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-screen">
          <span>User not found.</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{accountText}</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="profile">{profileText}</TabsTrigger>
            <TabsTrigger value="security">{securityText}</TabsTrigger>
            <TabsTrigger value="preferences">{preferencesText}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{personalInfoText}</CardTitle>
                  <CardDescription>{manageYourAccountText}</CardDescription>
                </div>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {editText}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                    >
                      {cancelText}
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      {saveText}
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6 px-[10px] px-[10px]">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-24 w-24 flex items-center justify-center rounded-full border">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <User className="mr-2 h-4 w-4" />
                        Change Photo
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 grid gap-4 md:grid-cols-2">
                    {[
                      { id: "name", label: nameText, value: userData.name },
                      { id: "email", label: emailText, value: userData.email },
                      { id: "phone", label: phoneText, value: userData.phone },
                      {
                        id: "jobTitle",
                        label: jobTitleText,
                        value: userData.jobTitle,
                      },
                      {
                        id: "company",
                        label: companyText,
                        value: userData.company,
                      },
                      {
                        id: "address",
                        label: addressText,
                        value: userData.address,
                      },
                    ].map(({ id, label, value }) => (
                      <div key={id} className="space-y-2">
                        <Label htmlFor={id}>{label}</Label>
                        <Input
                          id={id}
                          value={value}
                          onChange={(e) => handleChange(id, e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                    ))}
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">{bioText}</Label>
                      <textarea
                        id="bio"
                        className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={userData.bio}
                        onChange={(e) => handleChange("bio", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security and Preferences tabs (same as your original) */}
          {/* You can copy them below without change */}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
